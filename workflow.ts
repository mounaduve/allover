import { workflow, node, trigger, expr } from '@n8n/workflow-sdk';

const HTML_B64 = 'PCFET0NUWVBFIGh0bWw+CjxodG1sIGxhbmc9ImRlIj4KPGhlYWQ+CiAgPG1ldGEgY2hhcnNldD0iVVRGLTgiPgogIDxtZXRhIG5hbWU9InZpZXdwb3J0IiBjb250ZW50PSJ3aWR0aD1kZXZpY2Utd2lkdGgsIGluaXRpYWwtc2NhbGU9MS4wIj4KICA8dGl0bGU+VXJsYXVic3BhY2tsaXN0ZTwvdGl0bGU+CiAgPHNjcmlwdCBzcmM9Imh0dHBzOi8vY2RuLnRhaWx3aW5kY3NzLmNvbSI+PC9zY3JpcHQ+CiAgPHNjcmlwdCBkZWZlciBzcmM9Imh0dHBzOi8vY2RuLmpzZGVsaXZyLm5ldC9ucG0vYWxwaW5lanNAMy9kaXN0L2Nkbi5taW4uanMiPjwvc2NyaXB0PgogIDxzdHlsZT4KICAgIFt4LWNsb2FrXSB7IGRpc3BsYXk6IG5vbmUgIWltcG9ydGFudDsgfQogICAgYm9keSB7IC13ZWJraXQtdGFwLWhpZ2hsaWdodC1jb2xvcjogdHJhbnNwYXJlbnQ7IH0KICA8L3N0eWxlPgo8L2hlYWQ+Cjxib2R5IGNsYXNzPSJiZy1zbGF0ZS0xMDAgbWluLWgtc2NyZWVuIHRleHQtc2xhdGUtODAwIj4KICA8ZGl2IHgtZGF0YT0icGFja2xpc3RlKCkiIHgtaW5pdD0iaW5pdCgpIiB4LWNsb2FrIGNsYXNzPSJtYXgtdy14bCBteC1hdXRvIHB4LTQgcHktNiBwYi0yOCI+CgogICAgPCEtLSBLb3BmIC0tPgogICAgPGhlYWRlciBjbGFzcz0ibWItNSI+CiAgICAgIDxkaXYgY2xhc3M9ImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiI+CiAgICAgICAgPGgxIGNsYXNzPSJ0ZXh0LTJ4bCBmb250LWJvbGQgdGV4dC1zbGF0ZS05MDAiPvCfp7MgVXJsYXVic3BhY2tsaXN0ZTwvaDE+CiAgICAgICAgPGJ1dHRvbiBAY2xpY2s9ImxvYWQoKSIgOmNsYXNzPSJsb2FkaW5nICYmICdhbmltYXRlLXNwaW4nIiBjbGFzcz0idGV4dC1zbGF0ZS00MDAgdGV4dC14bCIgdGl0bGU9IkFrdHVhbGlzaWVyZW4iPuKfszwvYnV0dG9uPgogICAgICA8L2Rpdj4KICAgICAgPHAgY2xhc3M9InRleHQtc20gdGV4dC1zbGF0ZS01MDAgbXQtMSIgeC10ZXh0PSJzdGF0dXNUZXh0KCkiPjwvcD4KICAgICAgPCEtLSBGb3J0c2Nocml0dHNiYWxrZW4gLS0+CiAgICAgIDxkaXYgY2xhc3M9Im10LTMgaC0yIHctZnVsbCByb3VuZGVkLWZ1bGwgYmctc2xhdGUtMjAwIG92ZXJmbG93LWhpZGRlbiI+CiAgICAgICAgPGRpdiBjbGFzcz0iaC1mdWxsIGJnLWVtZXJhbGQtNTAwIHRyYW5zaXRpb24tYWxsIGR1cmF0aW9uLTMwMCIgOnN0eWxlPSJgd2lkdGg6ICR7cHJvZ3Jlc3MoKX0lYCI+PC9kaXY+CiAgICAgIDwvZGl2PgogICAgPC9oZWFkZXI+CgogICAgPCEtLSBMaXN0ZSBuYWNoIEthdGVnb3JpZSAtLT4KICAgIDx0ZW1wbGF0ZSB4LWZvcj0iY2F0IGluIGNhdGVnb3JpZXMoKSIgOmtleT0iY2F0Ij4KICAgICAgPHNlY3Rpb24gY2xhc3M9Im1iLTUiPgogICAgICAgIDxoMiBjbGFzcz0idGV4dC14cyBmb250LXNlbWlib2xkIHVwcGVyY2FzZSB0cmFja2luZy13aWRlIHRleHQtc2xhdGUtNDAwIG1iLTIgcHgtMSIgeC10ZXh0PSJjYXQiPjwvaDI+CiAgICAgICAgPGRpdiBjbGFzcz0iYmctd2hpdGUgcm91bmRlZC0yeGwgc2hhZG93LXNtIGRpdmlkZS15IGRpdmlkZS1zbGF0ZS0xMDAgb3ZlcmZsb3ctaGlkZGVuIj4KICAgICAgICAgIDx0ZW1wbGF0ZSB4LWZvcj0iaXRlbSBpbiBpdGVtc0luKGNhdCkiIDprZXk9Iml0ZW0uaWQiPgogICAgICAgICAgICA8ZGl2IGNsYXNzPSJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMyBweC00IHB5LTMgYWN0aXZlOmJnLXNsYXRlLTUwIj4KICAgICAgICAgICAgICA8YnV0dG9uIEBjbGljaz0idG9nZ2xlKGl0ZW0pIgogICAgICAgICAgICAgICAgOmNsYXNzPSJpdGVtLmNvbXBsZXRlZCA/ICdiZy1lbWVyYWxkLTUwMCBib3JkZXItZW1lcmFsZC01MDAnIDogJ2JvcmRlci1zbGF0ZS0zMDAnIgogICAgICAgICAgICAgICAgY2xhc3M9InNocmluay0wIHctNiBoLTYgcm91bmRlZC1mdWxsIGJvcmRlci0yIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRyYW5zaXRpb24tY29sb3JzIj4KICAgICAgICAgICAgICAgIDxzcGFuIHgtc2hvdz0iaXRlbS5jb21wbGV0ZWQiIGNsYXNzPSJ0ZXh0LXdoaXRlIHRleHQtc20iPuKckzwvc3Bhbj4KICAgICAgICAgICAgICA8L2J1dHRvbj4KICAgICAgICAgICAgICA8c3BhbiBjbGFzcz0iZmxleC0xIHRleHQtWzE1cHhdIgogICAgICAgICAgICAgICAgOmNsYXNzPSJpdGVtLmNvbXBsZXRlZCAmJiAnbGluZS10aHJvdWdoIHRleHQtc2xhdGUtNDAwJyIKICAgICAgICAgICAgICAgIHgtdGV4dD0iaXRlbS50aXRsZSI+PC9zcGFuPgogICAgICAgICAgICAgIDxidXR0b24gQGNsaWNrPSJyZW1vdmUoaXRlbSkiIGNsYXNzPSJzaHJpbmstMCB0ZXh0LXNsYXRlLTMwMCBob3Zlcjp0ZXh0LXJvc2UtNTAwIHRleHQtbGcgcHgtMSI+w5c8L2J1dHRvbj4KICAgICAgICAgICAgPC9kaXY+CiAgICAgICAgICA8L3RlbXBsYXRlPgogICAgICAgIDwvZGl2PgogICAgICA8L3NlY3Rpb24+CiAgICA8L3RlbXBsYXRlPgoKICAgIDxwIHgtc2hvdz0iaXRlbXMubGVuZ3RoID09PSAwICYmICFsb2FkaW5nIiBjbGFzcz0idGV4dC1jZW50ZXIgdGV4dC1zbGF0ZS00MDAgcHktMTAiPgogICAgICBOb2NoIG5pY2h0cyBkcmF1ZiDigJMgZsO8Z2UgdW50ZW4gZGVuIGVyc3RlbiBQdW5rdCBoaW56dS4g8J+RhwogICAgPC9wPgogIDwvZGl2PgoKICA8IS0tIEVpbmdhYmVsZWlzdGUgdW50ZW4gLS0+CiAgPGZvcm0gQHN1Ym1pdC5wcmV2ZW50PSJhZGQoKSIKICAgIHgtZGF0YT0ie30iCiAgICBjbGFzcz0iZml4ZWQgYm90dG9tLTAgaW5zZXQteC0wIGJvcmRlci10IGJvcmRlci1zbGF0ZS0yMDAgYmctd2hpdGUvOTUgYmFja2Ryb3AtYmx1ciBweC00IHB5LTMiPgogICAgPGRpdiBjbGFzcz0ibWF4LXcteGwgbXgtYXV0byBmbGV4IGdhcC0yIiB4LWRhdGE9InBhY2tsaXN0ZUlucHV0KCkiPgogICAgICA8c2VsZWN0IHgtbW9kZWw9ImNhdCIgY2xhc3M9InJvdW5kZWQteGwgYm9yZGVyIGJvcmRlci1zbGF0ZS0zMDAgYmctd2hpdGUgcHgtMiBweS0yIHRleHQtc20gdGV4dC1zbGF0ZS02MDAiPgogICAgICAgIDx0ZW1wbGF0ZSB4LWZvcj0iYyBpbiAkcm9vdC5fY2F0ZWdvcmllcyIgOmtleT0iYyI+PG9wdGlvbiB4LXRleHQ9ImMiIDp2YWx1ZT0iYyI+PC9vcHRpb24+PC90ZW1wbGF0ZT4KICAgICAgPC9zZWxlY3Q+CiAgICAgIDxpbnB1dCB4LW1vZGVsPSJ0aXRsZSIgdHlwZT0idGV4dCIgcGxhY2Vob2xkZXI9IldhcyBub2NoIGVpbnBhY2tlbj8iIGVudGVya2V5aGludD0iZG9uZSIKICAgICAgICBjbGFzcz0iZmxleC0xIHJvdW5kZWQteGwgYm9yZGVyIGJvcmRlci1zbGF0ZS0zMDAgcHgtMyBweS0yIHRleHQtWzE1cHhdIGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpyaW5nLTIgZm9jdXM6cmluZy1lbWVyYWxkLTQwMCI+CiAgICAgIDxidXR0b24gdHlwZT0ic3VibWl0IiBjbGFzcz0icm91bmRlZC14bCBiZy1lbWVyYWxkLTYwMCB0ZXh0LXdoaXRlIHB4LTQgcHktMiBmb250LW1lZGl1bSBhY3RpdmU6YmctZW1lcmFsZC03MDAiPis8L2J1dHRvbj4KICAgIDwvZGl2PgogIDwvZm9ybT4KCiAgPHNjcmlwdCBpZD0iX19kYXRhIiB0eXBlPSJhcHBsaWNhdGlvbi9qc29uIj5fX0RBVEFfUExBQ0VIT0xERVJfXzwvc2NyaXB0PgogIDxzY3JpcHQ+CiAgICBjb25zdCBDQVRTID0gWydEb2t1bWVudGUnLCAnS2xlaWR1bmcnLCAnS3VsdHVyYmV1dGVsJywgJ1RlY2huaWsnLCAnU3RyYW5kJywgJ1NvbnN0aWdlcyddOwoKICAgIGZ1bmN0aW9uIHBhY2tsaXN0ZSgpIHsKICAgICAgcmV0dXJuIHsKICAgICAgICBpdGVtczogW10sCiAgICAgICAgbG9hZGluZzogZmFsc2UsCiAgICAgICAgX2NhdGVnb3JpZXM6IENBVFMsCiAgICAgICAgaW5pdCgpIHsKICAgICAgICAgIHRyeSB7CiAgICAgICAgICAgIHRoaXMuaXRlbXMgPSBKU09OLnBhcnNlKGF0b2IoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ19fZGF0YScpLnRleHRDb250ZW50KSkgfHwgW107CiAgICAgICAgICB9IGNhdGNoIChlKSB7IHRoaXMuaXRlbXMgPSBbXTsgfQogICAgICAgICAgLy8gQWxsZSB+OCBTZWsuIG5ldSBsYWRlbiwgZGFtaXQgaWhyIGJlaWRlIGRpZXNlbGJlbiBIw6RrY2hlbiBzZWh0CiAgICAgICAgICBzZXRJbnRlcnZhbCgoKSA9PiB0aGlzLmxvYWQoKSwgODAwMCk7CiAgICAgICAgfSwKICAgICAgICBjYXRlZ29yaWVzKCkgewogICAgICAgICAgY29uc3QgcHJlc2VudCA9IFsuLi5uZXcgU2V0KHRoaXMuaXRlbXMubWFwKGkgPT4gaS5jYXRlZ29yeSB8fCAnU29uc3RpZ2VzJykpXTsKICAgICAgICAgIHJldHVybiBDQVRTLmZpbHRlcihjID0+IHByZXNlbnQuaW5jbHVkZXMoYykpLmNvbmNhdChwcmVzZW50LmZpbHRlcihjID0+ICFDQVRTLmluY2x1ZGVzKGMpKSk7CiAgICAgICAgfSwKICAgICAgICBpdGVtc0luKGNhdCkgewogICAgICAgICAgcmV0dXJuIHRoaXMuaXRlbXMuZmlsdGVyKGkgPT4gKGkuY2F0ZWdvcnkgfHwgJ1NvbnN0aWdlcycpID09PSBjYXQpOwogICAgICAgIH0sCiAgICAgICAgcHJvZ3Jlc3MoKSB7CiAgICAgICAgICBpZiAoIXRoaXMuaXRlbXMubGVuZ3RoKSByZXR1cm4gMDsKICAgICAgICAgIHJldHVybiBNYXRoLnJvdW5kKDEwMCAqIHRoaXMuaXRlbXMuZmlsdGVyKGkgPT4gaS5jb21wbGV0ZWQpLmxlbmd0aCAvIHRoaXMuaXRlbXMubGVuZ3RoKTsKICAgICAgICB9LAogICAgICAgIHN0YXR1c1RleHQoKSB7CiAgICAgICAgICBjb25zdCBkb25lID0gdGhpcy5pdGVtcy5maWx0ZXIoaSA9PiBpLmNvbXBsZXRlZCkubGVuZ3RoOwogICAgICAgICAgcmV0dXJuIGAke2RvbmV9IHZvbiAke3RoaXMuaXRlbXMubGVuZ3RofSBlaW5nZXBhY2t0YDsKICAgICAgICB9LAogICAgICAgIGFzeW5jIGxvYWQoKSB7CiAgICAgICAgICB0aGlzLmxvYWRpbmcgPSB0cnVlOwogICAgICAgICAgdHJ5IHsKICAgICAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJy93ZWJob29rL3BhY2tsaXN0ZS9pdGVtcycsIHsgY2FjaGU6ICduby1zdG9yZScgfSk7CiAgICAgICAgICAgIGlmIChyZXMub2spIHRoaXMuaXRlbXMgPSBhd2FpdCByZXMuanNvbigpOwogICAgICAgICAgfSBjYXRjaCAoZSkge30gZmluYWxseSB7IHRoaXMubG9hZGluZyA9IGZhbHNlOyB9CiAgICAgICAgfSwKICAgICAgICBhc3luYyB0b2dnbGUoaXRlbSkgewogICAgICAgICAgaXRlbS5jb21wbGV0ZWQgPSAhaXRlbS5jb21wbGV0ZWQ7CiAgICAgICAgICB0cnkgewogICAgICAgICAgICBhd2FpdCBmZXRjaCgnL3dlYmhvb2svcGFja2xpc3RlL3RvZ2dsZScsIHsKICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJywgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sCiAgICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBpZDogaXRlbS5pZCwgY29tcGxldGVkOiBpdGVtLmNvbXBsZXRlZCB9KQogICAgICAgICAgICB9KTsKICAgICAgICAgIH0gY2F0Y2ggKGUpIHsgaXRlbS5jb21wbGV0ZWQgPSAhaXRlbS5jb21wbGV0ZWQ7IH0KICAgICAgICB9LAogICAgICAgIGFzeW5jIGFkZCh0aXRsZSwgY2F0ZWdvcnkpIHsKICAgICAgICAgIGlmICghdGl0bGUgfHwgIXRpdGxlLnRyaW0oKSkgcmV0dXJuIG51bGw7CiAgICAgICAgICBjb25zdCBvcHRpbWlzdGljID0geyBpZDogJ3RtcC0nICsgRGF0ZS5ub3coKSwgdGl0bGU6IHRpdGxlLnRyaW0oKSwgY2F0ZWdvcnk6IGNhdGVnb3J5IHx8ICdTb25zdGlnZXMnLCBjb21wbGV0ZWQ6IGZhbHNlIH07CiAgICAgICAgICB0aGlzLml0ZW1zLnB1c2gob3B0aW1pc3RpYyk7CiAgICAgICAgICB0cnkgewogICAgICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCgnL3dlYmhvb2svcGFja2xpc3RlL2FkZCcsIHsKICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJywgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sCiAgICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyB0aXRsZTogb3B0aW1pc3RpYy50aXRsZSwgY2F0ZWdvcnk6IG9wdGltaXN0aWMuY2F0ZWdvcnkgfSkKICAgICAgICAgICAgfSk7CiAgICAgICAgICAgIGlmIChyZXMub2spIHsKICAgICAgICAgICAgICBjb25zdCBjcmVhdGVkID0gYXdhaXQgcmVzLmpzb24oKTsKICAgICAgICAgICAgICBjb25zdCByb3cgPSBBcnJheS5pc0FycmF5KGNyZWF0ZWQpID8gY3JlYXRlZFswXSA6IGNyZWF0ZWQ7CiAgICAgICAgICAgICAgaWYgKHJvdyAmJiByb3cuaWQpIE9iamVjdC5hc3NpZ24ob3B0aW1pc3RpYywgcm93KTsKICAgICAgICAgICAgfQogICAgICAgICAgfSBjYXRjaCAoZSkge30KICAgICAgICAgIHJldHVybiB0cnVlOwogICAgICAgIH0sCiAgICAgICAgYXN5bmMgcmVtb3ZlKGl0ZW0pIHsKICAgICAgICAgIHRoaXMuaXRlbXMgPSB0aGlzLml0ZW1zLmZpbHRlcihpID0+IGkuaWQgIT09IGl0ZW0uaWQpOwogICAgICAgICAgdHJ5IHsKICAgICAgICAgICAgYXdhaXQgZmV0Y2goJy93ZWJob29rL3BhY2tsaXN0ZS9kZWxldGUnLCB7CiAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LAogICAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgaWQ6IGl0ZW0uaWQgfSkKICAgICAgICAgICAgfSk7CiAgICAgICAgICB9IGNhdGNoIChlKSB7fQogICAgICAgIH0KICAgICAgfTsKICAgIH0KCiAgICAvLyBrbGVpbmVyIEhlbGZlciBmw7xyIGRpZSBFaW5nYWJlbGVpc3RlLCBncmVpZnQgYXVmIGRpZSBIYXVwdC1Lb21wb25lbnRlIHp1CiAgICBmdW5jdGlvbiBwYWNrbGlzdGVJbnB1dCgpIHsKICAgICAgcmV0dXJuIHsKICAgICAgICB0aXRsZTogJycsCiAgICAgICAgY2F0OiAnU29uc3RpZ2VzJywKICAgICAgICBhZGQoKSB7CiAgICAgICAgICBjb25zdCByb290ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignW3gtZGF0YV49InBhY2tsaXN0ZSJdJykuX194LiRkYXRhOwogICAgICAgICAgcm9vdC5hZGQodGhpcy50aXRsZSwgdGhpcy5jYXQpOwogICAgICAgICAgdGhpcy50aXRsZSA9ICcnOwogICAgICAgIH0KICAgICAgfTsKICAgIH0KICA8L3NjcmlwdD4KPC9ib2R5Pgo8L2h0bWw+Cg==';
const TABLE = 'packliste';

const pageWebhook = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: { name: 'GET Packliste', parameters: { httpMethod: 'GET', path: 'packliste', responseMode: 'responseNode', options: {} } },
  output: [{}]
});
const itemsWebhook = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: { name: 'GET Items JSON', parameters: { httpMethod: 'GET', path: 'packliste/items', responseMode: 'responseNode', options: {} } },
  output: [{}]
});
const toggleWebhook = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: { name: 'POST Toggle', parameters: { httpMethod: 'POST', path: 'packliste/toggle', responseMode: 'responseNode', options: {} } },
  output: [{ body: { id: 1, completed: true } }]
});
const addWebhook = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: { name: 'POST Add', parameters: { httpMethod: 'POST', path: 'packliste/add', responseMode: 'responseNode', options: {} } },
  output: [{ body: { title: 'Neuer Punkt', category: 'Sonstiges' } }]
});
const deleteWebhook = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: { name: 'POST Delete', parameters: { httpMethod: 'POST', path: 'packliste/delete', responseMode: 'responseNode', options: {} } },
  output: [{ body: { id: 1 } }]
});

const getRowsForPage = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Alle Zeilen holen',
    parameters: {
      resource: 'row',
      operation: 'get',
      dataTableId: { __rl: true, mode: 'name', value: TABLE },
      returnAll: true,
      orderBy: true,
      orderByColumn: 'createdAt',
      orderByDirection: 'ASC',
      filters: {}
    }
  },
  output: [{ id: 1, title: 'Reisepass', category: 'Dokumente', completed: false }]
});
const aggregateRows = node({
  type: 'n8n-nodes-base.aggregate',
  version: 1,
  config: { name: 'Zeilen sammeln', parameters: { aggregate: 'aggregateAllItemData', destinationFieldName: 'data', include: 'allFields', options: {} } },
  output: [{ data: [{ id: 1, title: 'Reisepass', category: 'Dokumente', completed: false }] }]
});
const buildPage = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Seite bauen',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode:
        'var rows = ($input.all()[0] && $input.all()[0].json.data) ? $input.all()[0].json.data : [];\n' +
        'var encoded = Buffer.from(JSON.stringify(rows)).toString("base64");\n' +
        'var html = Buffer.from("' + HTML_B64 + '", "base64").toString("utf8").replace("__DATA_PLACEHOLDER__", encoded);\n' +
        'return [{ json: { html: html } }];'
    }
  },
  output: [{ html: '<!DOCTYPE html>...' }]
});
const respondPage = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'Seite senden',
    parameters: {
      respondWith: 'text',
      responseBody: expr('{{ $json.html }}'),
      options: { responseHeaders: { entries: [{ name: 'Content-Type', value: 'text/html; charset=utf-8' }] } }
    }
  },
  output: [{}]
});

const getRowsJson = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Zeilen als JSON',
    parameters: {
      resource: 'row',
      operation: 'get',
      dataTableId: { __rl: true, mode: 'name', value: TABLE },
      returnAll: true,
      orderBy: true,
      orderByColumn: 'createdAt',
      orderByDirection: 'ASC',
      filters: {}
    }
  },
  output: [{ id: 1, title: 'Reisepass', category: 'Dokumente', completed: false }]
});
const respondItems = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'JSON senden',
    parameters: {
      respondWith: 'allIncomingItems',
      options: { responseHeaders: { entries: [{ name: 'Content-Type', value: 'application/json; charset=utf-8' }] } }
    }
  },
  output: [{}]
});

const updateRow = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Häkchen speichern',
    parameters: {
      resource: 'row',
      operation: 'update',
      dataTableId: { __rl: true, mode: 'name', value: TABLE },
      matchType: 'allConditions',
      filters: { conditions: [{ keyName: 'id', condition: 'eq', keyValue: expr('{{ $json.body.id }}') }] },
      columns: {
        mappingMode: 'defineBelow',
        value: { completed: expr('{{ $json.body.completed }}') },
        schema: [{ id: 'completed', displayName: 'completed', required: false, defaultMatch: false, display: true, type: 'boolean', canBeUsedToMatch: false }]
      },
      options: {}
    }
  },
  output: [{ id: 1, completed: true }]
});
const respondToggle = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: { name: 'Toggle Antwort', parameters: { respondWith: 'allIncomingItems', options: {} } },
  output: [{}]
});

const insertRow = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Punkt einfügen',
    parameters: {
      resource: 'row',
      operation: 'insert',
      dataTableId: { __rl: true, mode: 'name', value: TABLE },
      columns: {
        mappingMode: 'defineBelow',
        value: {
          title: expr('{{ $json.body.title }}'),
          category: expr('{{ $json.body.category || "Sonstiges" }}'),
          completed: false
        },
        schema: [
          { id: 'title', displayName: 'title', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'category', displayName: 'category', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'completed', displayName: 'completed', required: false, defaultMatch: false, display: true, type: 'boolean', canBeUsedToMatch: false }
        ]
      },
      options: {}
    }
  },
  output: [{ id: 20, title: 'Neuer Punkt', category: 'Sonstiges', completed: false }]
});
const respondAdd = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'Add Antwort',
    parameters: {
      respondWith: 'allIncomingItems',
      options: { responseHeaders: { entries: [{ name: 'Content-Type', value: 'application/json; charset=utf-8' }] } }
    }
  },
  output: [{}]
});

const deleteRow = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Punkt löschen',
    parameters: {
      resource: 'row',
      operation: 'deleteRows',
      dataTableId: { __rl: true, mode: 'name', value: TABLE },
      matchType: 'allConditions',
      filters: { conditions: [{ keyName: 'id', condition: 'eq', keyValue: expr('{{ $json.body.id }}') }] },
      options: {}
    }
  },
  output: [{ id: 1 }]
});
const respondDelete = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: { name: 'Delete Antwort', parameters: { respondWith: 'allIncomingItems', options: {} } },
  output: [{}]
});

export default workflow('packliste-app', 'Urlaubspackliste (geteilte Liste)')
  .add(pageWebhook).to(getRowsForPage).to(aggregateRows).to(buildPage).to(respondPage)
  .add(itemsWebhook).to(getRowsJson).to(respondItems)
  .add(toggleWebhook).to(updateRow).to(respondToggle)
  .add(addWebhook).to(insertRow).to(respondAdd)
  .add(deleteWebhook).to(deleteRow).to(respondDelete);
