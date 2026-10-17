// wk-whatsapp-bridge: hält die WhatsApp-Verbindung (verknüpftes Gerät über
// whatsmeow) dauerhaft offen, speichert eingehende/ausgehende Nachrichten in
// SQLite und bietet dem Python-Connector eine kleine interne HTTP-API.
//
// Die API ist nur im Docker-Netz erreichbar und zusätzlich über das gemeinsame
// Geheimnis BRIDGE_TOKEN (Header X-Bridge-Token) geschützt.
package main

import (
	"context"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"syscall"
	"time"

	_ "github.com/mattn/go-sqlite3"
	"github.com/skip2/go-qrcode"
	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/proto/waE2E"
	"go.mau.fi/whatsmeow/store"
	"go.mau.fi/whatsmeow/store/sqlstore"
	"go.mau.fi/whatsmeow/types"
	"go.mau.fi/whatsmeow/types/events"
	waLog "go.mau.fi/whatsmeow/util/log"
	"google.golang.org/protobuf/proto"
)

var (
	dataDir     = envOr("DATA_DIR", "/data")
	listenAddr  = envOr("LISTEN_ADDR", ":8080")
	bridgeToken = os.Getenv("BRIDGE_TOKEN")
	nonDigits   = regexp.MustCompile(`[^0-9]`)
)

func envOr(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

type Bridge struct {
	client *whatsmeow.Client
	db     *sql.DB
	logger waLog.Logger

	mu        sync.Mutex
	qrCode    string // aktueller QR-Code-Inhalt, solange nicht verknüpft
	lastError string
}

func main() {
	if bridgeToken == "" {
		log.Fatal("BRIDGE_TOKEN muss gesetzt sein")
	}
	if err := os.MkdirAll(dataDir, 0o700); err != nil {
		log.Fatal(err)
	}
	logger := waLog.Stdout("Bridge", envOr("LOG_LEVEL", "INFO"), true)
	ctx := context.Background()

	store.SetOSInfo("Claude WhatsApp Connector", [3]uint32{1, 0, 0})

	container, err := sqlstore.New(ctx, "sqlite3",
		"file:"+filepath.Join(dataDir, "session.db")+"?_foreign_keys=on", logger.Sub("Store"))
	if err != nil {
		log.Fatalf("Session-DB: %v", err)
	}
	device, err := container.GetFirstDevice(ctx)
	if err != nil {
		log.Fatalf("Gerät laden: %v", err)
	}

	db, err := sql.Open("sqlite3", "file:"+filepath.Join(dataDir, "messages.db")+"?_journal_mode=WAL&_busy_timeout=5000")
	if err != nil {
		log.Fatalf("Nachrichten-DB: %v", err)
	}
	if err := initMessageDB(db); err != nil {
		log.Fatalf("Nachrichten-DB anlegen: %v", err)
	}

	b := &Bridge{client: whatsmeow.NewClient(device, logger.Sub("Client")), db: db, logger: logger}
	b.client.AddEventHandler(b.handleEvent)

	if err := b.connect(ctx); err != nil {
		log.Fatalf("Verbinden: %v", err)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, _ *http.Request) { writeJSON(w, 200, map[string]any{"ok": true}) })
	mux.HandleFunc("GET /status", b.auth(b.handleStatus))
	mux.HandleFunc("GET /qr.png", b.auth(b.handleQRPNG))
	mux.HandleFunc("POST /pair-phone", b.auth(b.handlePairPhone))
	mux.HandleFunc("POST /logout", b.auth(b.handleLogout))
	mux.HandleFunc("GET /chats", b.auth(b.handleChats))
	mux.HandleFunc("GET /messages", b.auth(b.handleMessages))
	mux.HandleFunc("GET /contacts", b.auth(b.handleContacts))
	mux.HandleFunc("POST /send", b.auth(b.handleSend))
	mux.HandleFunc("POST /send-file", b.auth(b.handleSendFile))
	mux.HandleFunc("GET /media", b.auth(b.handleMedia))

	srv := &http.Server{Addr: listenAddr, Handler: mux, ReadHeaderTimeout: 10 * time.Second}
	go func() {
		logger.Infof("HTTP-API lauscht auf %s", listenAddr)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatal(err)
		}
	}()

	sig := make(chan os.Signal, 1)
	signal.Notify(sig, syscall.SIGINT, syscall.SIGTERM)
	<-sig
	_ = srv.Shutdown(context.Background())
	b.client.Disconnect()
}

// connect verbindet sich; ist noch kein Gerät verknüpft, läuft im Hintergrund
// eine QR-Schleife, deren aktueller Code über /status und /qr.png abrufbar ist.
func (b *Bridge) connect(ctx context.Context) error {
	if b.client.Store.ID != nil {
		return b.client.Connect()
	}
	qrChan, err := b.client.GetQRChannel(ctx)
	if err != nil {
		return err
	}
	if err := b.client.Connect(); err != nil {
		return err
	}
	go func() {
		for item := range qrChan {
			b.mu.Lock()
			switch item.Event {
			case "code":
				b.qrCode = item.Code
				b.logger.Infof("Neuer QR-Code bereit – auf der Einrichtungsseite scannen")
			case "success":
				b.qrCode = ""
				b.lastError = ""
			default:
				b.qrCode = ""
				if item.Error != nil {
					b.lastError = item.Error.Error()
				} else {
					b.lastError = "QR-Kopplung beendet: " + item.Event
				}
			}
			b.mu.Unlock()
		}
	}()
	return nil
}

// ---------------------------------------------------------------------------
// Speicher
// ---------------------------------------------------------------------------

func initMessageDB(db *sql.DB) error {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS chats (
			jid TEXT PRIMARY KEY,
			name TEXT,
			is_group INTEGER,
			last_message_time INTEGER
		);
		CREATE TABLE IF NOT EXISTS messages (
			id TEXT,
			chat_jid TEXT,
			sender TEXT,
			sender_name TEXT,
			is_from_me INTEGER,
			timestamp INTEGER,
			text TEXT,
			media_type TEXT,
			filename TEXT,
			raw BLOB,
			PRIMARY KEY (id, chat_jid)
		);
		CREATE INDEX IF NOT EXISTS idx_messages_chat_time ON messages(chat_jid, timestamp);
		CREATE INDEX IF NOT EXISTS idx_messages_time ON messages(timestamp);
	`)
	return err
}

// canonical übersetzt LID-Adressen (anonyme WhatsApp-IDs) wenn möglich in die
// Telefonnummer-JID, damit ein Kontakt nicht als zwei Chats auftaucht.
func (b *Bridge) canonical(ctx context.Context, jid types.JID) types.JID {
	jid = jid.ToNonAD()
	if jid.Server == types.HiddenUserServer {
		if pn, err := b.client.Store.LIDs.GetPNForLID(ctx, jid); err == nil && !pn.IsEmpty() {
			return pn.ToNonAD()
		}
	}
	return jid
}

func (b *Bridge) contactName(ctx context.Context, jid types.JID) string {
	c, err := b.client.Store.Contacts.GetContact(ctx, jid)
	if err != nil || !c.Found {
		return ""
	}
	for _, n := range []string{c.FullName, c.FirstName, c.BusinessName, c.PushName} {
		if n != "" {
			return n
		}
	}
	return ""
}

func (b *Bridge) chatName(ctx context.Context, jid types.JID, fallback string) string {
	if jid.Server == types.GroupServer {
		var existing string
		_ = b.db.QueryRow(`SELECT name FROM chats WHERE jid=?`, jid.String()).Scan(&existing)
		if existing != "" {
			return existing
		}
		if fallback != "" {
			return fallback // Name aus dem Verlauf, spart einen Server-Aufruf
		}
		if info, err := b.client.GetGroupInfo(ctx, jid); err == nil && info.Name != "" {
			return info.Name
		}
		return fallback
	}
	if n := b.contactName(ctx, jid); n != "" {
		return n
	}
	if fallback != "" {
		return fallback
	}
	return "+" + jid.User
}

func (b *Bridge) upsertChat(jid types.JID, name string, ts time.Time) {
	_, err := b.db.Exec(`
		INSERT INTO chats (jid, name, is_group, last_message_time) VALUES (?, ?, ?, ?)
		ON CONFLICT(jid) DO UPDATE SET
			name = CASE WHEN excluded.name != '' THEN excluded.name ELSE chats.name END,
			last_message_time = MAX(COALESCE(chats.last_message_time, 0), excluded.last_message_time)`,
		jid.String(), name, jid.Server == types.GroupServer, ts.Unix())
	if err != nil {
		b.logger.Warnf("Chat speichern: %v", err)
	}
}

func extractContent(msg *waE2E.Message) (text, mediaType, filename string) {
	if msg == nil {
		return
	}
	switch {
	case msg.GetConversation() != "":
		text = msg.GetConversation()
	case msg.GetExtendedTextMessage() != nil:
		text = msg.GetExtendedTextMessage().GetText()
	case msg.GetImageMessage() != nil:
		text, mediaType = msg.GetImageMessage().GetCaption(), "image"
	case msg.GetVideoMessage() != nil:
		text, mediaType = msg.GetVideoMessage().GetCaption(), "video"
	case msg.GetAudioMessage() != nil:
		mediaType = "audio"
	case msg.GetDocumentMessage() != nil:
		d := msg.GetDocumentMessage()
		text, mediaType, filename = d.GetCaption(), "document", d.GetFileName()
	case msg.GetStickerMessage() != nil:
		mediaType = "sticker"
	case msg.GetLocationMessage() != nil:
		l := msg.GetLocationMessage()
		text = fmt.Sprintf("📍 %s %s (%.5f, %.5f)", l.GetName(), l.GetAddress(), l.GetDegreesLatitude(), l.GetDegreesLongitude())
	case msg.GetContactMessage() != nil:
		text = "👤 " + msg.GetContactMessage().GetDisplayName()
	case msg.GetPollCreationMessage() != nil:
		text = "📊 " + msg.GetPollCreationMessage().GetName()
	}
	return
}

func (b *Bridge) storeMessage(ctx context.Context, evt *events.Message, chatNameHint string) {
	text, mediaType, filename := extractContent(evt.Message)
	if text == "" && mediaType == "" {
		return // Reaktionen, Protokoll-Nachrichten usw.
	}
	chat := b.canonical(ctx, evt.Info.Chat)
	sender := b.canonical(ctx, evt.Info.Sender)
	senderName := evt.Info.PushName
	if evt.Info.IsFromMe {
		senderName = "Ich"
	} else if n := b.contactName(ctx, sender); n != "" {
		senderName = n
	}
	var raw []byte
	if mediaType != "" {
		raw, _ = proto.Marshal(evt.Message)
	}
	b.upsertChat(chat, b.chatName(ctx, chat, chatNameHint), evt.Info.Timestamp)
	_, err := b.db.Exec(`
		INSERT OR REPLACE INTO messages (id, chat_jid, sender, sender_name, is_from_me, timestamp, text, media_type, filename, raw)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		evt.Info.ID, chat.String(), sender.User, senderName, evt.Info.IsFromMe, evt.Info.Timestamp.Unix(),
		text, mediaType, filename, raw)
	if err != nil {
		b.logger.Warnf("Nachricht speichern: %v", err)
	}
}

func (b *Bridge) handleEvent(rawEvt any) {
	ctx := context.Background()
	switch evt := rawEvt.(type) {
	case *events.Message:
		b.storeMessage(ctx, evt, "")
	case *events.HistorySync:
		b.handleHistorySync(ctx, evt)
	case *events.Connected:
		b.logger.Infof("Mit WhatsApp verbunden")
	case *events.LoggedOut:
		b.logger.Warnf("Von WhatsApp abgemeldet (%s) – bitte neu verknüpfen", evt.Reason)
		b.mu.Lock()
		b.lastError = "Gerät wurde in WhatsApp abgemeldet – neu verknüpfen"
		b.mu.Unlock()
		go b.relink()
	}
}

// relink startet nach einer Abmeldung eine neue QR-Kopplung, damit die
// Einrichtungsseite ohne Container-Neustart wieder einen Code anzeigt.
func (b *Bridge) relink() {
	b.client.Disconnect()
	time.Sleep(2 * time.Second)
	if err := b.connect(context.Background()); err != nil {
		b.logger.Errorf("Neu verbinden nach Abmeldung: %v", err)
	}
}

func (b *Bridge) handleHistorySync(ctx context.Context, evt *events.HistorySync) {
	count := 0
	for _, conv := range evt.Data.GetConversations() {
		chatJID, err := types.ParseJID(conv.GetID())
		if err != nil {
			continue
		}
		for _, hm := range conv.GetMessages() {
			msg, err := b.client.ParseWebMessage(chatJID, hm.GetMessage())
			if err != nil {
				continue
			}
			b.storeMessage(ctx, msg, conv.GetName())
			count++
		}
	}
	b.logger.Infof("Verlauf synchronisiert: %d Nachrichten", count)
}

// ---------------------------------------------------------------------------
// HTTP-API
// ---------------------------------------------------------------------------

func (b *Bridge) auth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("X-Bridge-Token") != bridgeToken {
			writeJSON(w, 401, map[string]any{"error": "unauthorized"})
			return
		}
		next(w, r)
	}
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeErr(w http.ResponseWriter, status int, err error) {
	writeJSON(w, status, map[string]any{"error": err.Error()})
}

func intParam(r *http.Request, name string, def, max int) int {
	v, err := strconv.Atoi(r.URL.Query().Get(name))
	if err != nil || v <= 0 {
		return def
	}
	if v > max {
		return max
	}
	return v
}

func (b *Bridge) handleStatus(w http.ResponseWriter, _ *http.Request) {
	b.mu.Lock()
	defer b.mu.Unlock()
	resp := map[string]any{
		"connected":    b.client.IsConnected(),
		"logged_in":    b.client.IsLoggedIn(),
		"qr_available": b.qrCode != "",
		"last_error":   b.lastError,
	}
	if b.client.Store.ID != nil {
		resp["phone"] = "+" + b.client.Store.ID.User
		resp["push_name"] = b.client.Store.PushName
	}
	writeJSON(w, 200, resp)
}

func (b *Bridge) handleQRPNG(w http.ResponseWriter, _ *http.Request) {
	b.mu.Lock()
	code := b.qrCode
	b.mu.Unlock()
	if code == "" {
		writeJSON(w, 404, map[string]any{"error": "kein QR-Code verfügbar"})
		return
	}
	png, err := qrcode.Encode(code, qrcode.Medium, 320)
	if err != nil {
		writeErr(w, 500, err)
		return
	}
	w.Header().Set("Content-Type", "image/png")
	w.Header().Set("Cache-Control", "no-store")
	_, _ = w.Write(png)
}

// handlePairPhone liefert einen 8-stelligen Kopplungscode als Alternative zum
// QR-Code (praktisch, wenn die Einrichtungsseite auf demselben Handy offen ist).
func (b *Bridge) handlePairPhone(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Phone string `json:"phone"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, 400, err)
		return
	}
	if b.client.Store.ID != nil {
		writeJSON(w, 409, map[string]any{"error": "bereits verknüpft"})
		return
	}
	code, err := b.client.PairPhone(r.Context(), nonDigits.ReplaceAllString(req.Phone, ""), true,
		whatsmeow.PairClientChrome, "Chrome (Linux)")
	if err != nil {
		writeErr(w, 500, err)
		return
	}
	writeJSON(w, 200, map[string]any{"code": code})
}

func (b *Bridge) handleLogout(w http.ResponseWriter, r *http.Request) {
	if err := b.client.Logout(r.Context()); err != nil {
		writeErr(w, 500, err)
		return
	}
	go b.relink()
	writeJSON(w, 200, map[string]any{"status": "abgemeldet"})
}

func (b *Bridge) handleChats(w http.ResponseWriter, r *http.Request) {
	q := "%" + r.URL.Query().Get("query") + "%"
	limit := intParam(r, "limit", 20, 200)
	rows, err := b.db.Query(`
		SELECT c.jid, c.name, c.is_group, c.last_message_time,
			(SELECT COALESCE(NULLIF(m.text, ''), '[' || m.media_type || ']') FROM messages m
			 WHERE m.chat_jid = c.jid ORDER BY m.timestamp DESC LIMIT 1)
		FROM chats c
		WHERE c.name LIKE ? OR c.jid LIKE ?
		ORDER BY c.last_message_time DESC LIMIT ?`, q, q, limit)
	if err != nil {
		writeErr(w, 500, err)
		return
	}
	defer rows.Close()
	chats := []map[string]any{}
	for rows.Next() {
		var jid, name string
		var isGroup bool
		var ts int64
		var last sql.NullString
		if err := rows.Scan(&jid, &name, &isGroup, &ts, &last); err != nil {
			writeErr(w, 500, err)
			return
		}
		chats = append(chats, map[string]any{
			"jid": jid, "name": name, "is_group": isGroup,
			"last_message_time": time.Unix(ts, 0).Format(time.RFC3339), "last_message": last.String,
		})
	}
	writeJSON(w, 200, map[string]any{"chats": chats})
}

func (b *Bridge) handleMessages(w http.ResponseWriter, r *http.Request) {
	qs := r.URL.Query()
	where := []string{"1=1"}
	args := []any{}
	if chat := qs.Get("chat"); chat != "" {
		where = append(where, "m.chat_jid = ?")
		args = append(args, chat)
	}
	if query := qs.Get("query"); query != "" {
		where = append(where, "(m.text LIKE ? OR m.filename LIKE ?)")
		args = append(args, "%"+query+"%", "%"+query+"%")
	}
	if after := qs.Get("after"); after != "" {
		t, err := time.Parse(time.RFC3339, after)
		if err != nil {
			writeErr(w, 400, fmt.Errorf("after: %w", err))
			return
		}
		where = append(where, "m.timestamp >= ?")
		args = append(args, t.Unix())
	}
	if before := qs.Get("before"); before != "" {
		t, err := time.Parse(time.RFC3339, before)
		if err != nil {
			writeErr(w, 400, fmt.Errorf("before: %w", err))
			return
		}
		where = append(where, "m.timestamp < ?")
		args = append(args, t.Unix())
	}
	args = append(args, intParam(r, "limit", 30, 500))
	rows, err := b.db.Query(`
		SELECT m.id, m.chat_jid, COALESCE(c.name, ''), m.sender, m.sender_name, m.is_from_me, m.timestamp,
			m.text, m.media_type, m.filename
		FROM messages m LEFT JOIN chats c ON c.jid = m.chat_jid
		WHERE `+strings.Join(where, " AND ")+`
		ORDER BY m.timestamp DESC LIMIT ?`, args...)
	if err != nil {
		writeErr(w, 500, err)
		return
	}
	defer rows.Close()
	msgs := []map[string]any{}
	for rows.Next() {
		var id, chatJID, chatName, sender, senderName, text, mediaType, filename string
		var fromMe bool
		var ts int64
		if err := rows.Scan(&id, &chatJID, &chatName, &sender, &senderName, &fromMe, &ts, &text, &mediaType, &filename); err != nil {
			writeErr(w, 500, err)
			return
		}
		m := map[string]any{
			"id": id, "chat_jid": chatJID, "chat_name": chatName, "sender": sender, "sender_name": senderName,
			"is_from_me": fromMe, "time": time.Unix(ts, 0).Format(time.RFC3339), "text": text,
		}
		if mediaType != "" {
			m["media_type"] = mediaType
			if filename != "" {
				m["filename"] = filename
			}
		}
		msgs = append(msgs, m)
	}
	// Älteste zuerst, damit sich der Verlauf wie ein Chat liest.
	for i, j := 0, len(msgs)-1; i < j; i, j = i+1, j-1 {
		msgs[i], msgs[j] = msgs[j], msgs[i]
	}
	writeJSON(w, 200, map[string]any{"messages": msgs})
}

func (b *Bridge) handleContacts(w http.ResponseWriter, r *http.Request) {
	query := strings.ToLower(r.URL.Query().Get("query"))
	limit := intParam(r, "limit", 20, 200)
	all, err := b.client.Store.Contacts.GetAllContacts(r.Context())
	if err != nil {
		writeErr(w, 500, err)
		return
	}
	digits := nonDigits.ReplaceAllString(query, "")
	out := []map[string]any{}
	for jid, c := range all {
		if jid.Server != types.DefaultUserServer {
			continue
		}
		hay := strings.ToLower(strings.Join([]string{c.FullName, c.FirstName, c.PushName, c.BusinessName}, " "))
		if query != "" && !strings.Contains(hay, query) && (digits == "" || !strings.Contains(jid.User, digits)) {
			continue
		}
		name := c.FullName
		if name == "" {
			name = c.PushName
		}
		out = append(out, map[string]any{"jid": jid.String(), "phone": "+" + jid.User, "name": name, "push_name": c.PushName})
		if len(out) >= limit {
			break
		}
	}
	writeJSON(w, 200, map[string]any{"contacts": out})
}

// resolveRecipient akzeptiert eine vollständige JID oder eine Telefonnummer
// (beliebig formatiert, mit Ländervorwahl).
func resolveRecipient(to string) (types.JID, error) {
	to = strings.TrimSpace(to)
	if strings.Contains(to, "@") {
		return types.ParseJID(to)
	}
	digits := nonDigits.ReplaceAllString(to, "")
	if strings.HasPrefix(digits, "00") {
		digits = digits[2:]
	}
	if len(digits) < 8 {
		return types.JID{}, fmt.Errorf("ungültige Nummer oder JID: %q", to)
	}
	return types.NewJID(digits, types.DefaultUserServer), nil
}

func (b *Bridge) sendAndStore(ctx context.Context, to types.JID, msg *waE2E.Message) (map[string]any, error) {
	if !b.client.IsLoggedIn() {
		return nil, errors.New("WhatsApp ist nicht verknüpft")
	}
	resp, err := b.client.SendMessage(ctx, to, msg)
	if err != nil {
		return nil, err
	}
	own := types.EmptyJID
	if b.client.Store.ID != nil {
		own = *b.client.Store.ID
	}
	b.storeMessage(ctx, &events.Message{
		Info: types.MessageInfo{
			MessageSource: types.MessageSource{Chat: to, Sender: own, IsFromMe: true, IsGroup: to.Server == types.GroupServer},
			ID:            resp.ID,
			Timestamp:     resp.Timestamp,
		},
		Message: msg,
	}, "")
	return map[string]any{"status": "gesendet", "id": resp.ID, "to": to.String(), "time": resp.Timestamp.Format(time.RFC3339)}, nil
}

func (b *Bridge) handleSend(w http.ResponseWriter, r *http.Request) {
	var req struct {
		To   string `json:"to"`
		Text string `json:"text"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, 400, err)
		return
	}
	if strings.TrimSpace(req.Text) == "" {
		writeJSON(w, 400, map[string]any{"error": "text fehlt"})
		return
	}
	to, err := resolveRecipient(req.To)
	if err != nil {
		writeErr(w, 400, err)
		return
	}
	out, err := b.sendAndStore(r.Context(), to, &waE2E.Message{Conversation: proto.String(req.Text)})
	if err != nil {
		writeErr(w, 500, err)
		return
	}
	writeJSON(w, 200, out)
}

func (b *Bridge) handleSendFile(w http.ResponseWriter, r *http.Request) {
	var req struct {
		To       string `json:"to"`
		Filename string `json:"filename"`
		MimeType string `json:"mimetype"`
		DataB64  string `json:"data_base64"`
		Caption  string `json:"caption"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, 400, err)
		return
	}
	to, err := resolveRecipient(req.To)
	if err != nil {
		writeErr(w, 400, err)
		return
	}
	data, err := base64.StdEncoding.DecodeString(req.DataB64)
	if err != nil {
		writeErr(w, 400, fmt.Errorf("data_base64: %w", err))
		return
	}
	if req.MimeType == "" {
		req.MimeType = http.DetectContentType(data)
	}
	isImage := strings.HasPrefix(req.MimeType, "image/") && req.MimeType != "image/gif"
	mediaType := whatsmeow.MediaDocument
	if isImage {
		mediaType = whatsmeow.MediaImage
	}
	up, err := b.client.Upload(r.Context(), data, mediaType)
	if err != nil {
		writeErr(w, 500, fmt.Errorf("Upload: %w", err))
		return
	}
	var msg *waE2E.Message
	if isImage {
		msg = &waE2E.Message{ImageMessage: &waE2E.ImageMessage{
			Caption: proto.String(req.Caption), Mimetype: proto.String(req.MimeType),
			URL: &up.URL, DirectPath: &up.DirectPath, MediaKey: up.MediaKey,
			FileEncSHA256: up.FileEncSHA256, FileSHA256: up.FileSHA256, FileLength: &up.FileLength,
		}}
	} else {
		msg = &waE2E.Message{DocumentMessage: &waE2E.DocumentMessage{
			Caption: proto.String(req.Caption), Mimetype: proto.String(req.MimeType),
			FileName: proto.String(req.Filename), Title: proto.String(req.Filename),
			URL: &up.URL, DirectPath: &up.DirectPath, MediaKey: up.MediaKey,
			FileEncSHA256: up.FileEncSHA256, FileSHA256: up.FileSHA256, FileLength: &up.FileLength,
		}}
	}
	out, err := b.sendAndStore(r.Context(), to, msg)
	if err != nil {
		writeErr(w, 500, err)
		return
	}
	writeJSON(w, 200, out)
}

func (b *Bridge) handleMedia(w http.ResponseWriter, r *http.Request) {
	qs := r.URL.Query()
	var raw []byte
	var mediaType, filename string
	err := b.db.QueryRow(`SELECT raw, media_type, filename FROM messages WHERE id = ? AND chat_jid = ?`,
		qs.Get("id"), qs.Get("chat")).Scan(&raw, &mediaType, &filename)
	if errors.Is(err, sql.ErrNoRows) || len(raw) == 0 {
		writeJSON(w, 404, map[string]any{"error": "Nachricht mit Medien nicht gefunden"})
		return
	} else if err != nil {
		writeErr(w, 500, err)
		return
	}
	var msg waE2E.Message
	if err := proto.Unmarshal(raw, &msg); err != nil {
		writeErr(w, 500, err)
		return
	}
	data, err := b.client.DownloadAny(r.Context(), &msg)
	if err != nil {
		writeErr(w, 502, fmt.Errorf("Download (ältere Medien sind evtl. nicht mehr auf dem WhatsApp-Server): %w", err))
		return
	}
	mime := http.DetectContentType(data)
	for _, m := range []interface{ GetMimetype() string }{msg.GetImageMessage(), msg.GetVideoMessage(),
		msg.GetAudioMessage(), msg.GetDocumentMessage(), msg.GetStickerMessage()} {
		if m.GetMimetype() != "" {
			mime = m.GetMimetype()
			break
		}
	}
	writeJSON(w, 200, map[string]any{
		"media_type": mediaType, "filename": filename, "mimetype": mime,
		"size": len(data), "data_base64": base64.StdEncoding.EncodeToString(data),
	})
}
