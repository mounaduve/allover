import { workflow, node, trigger, expr } from '@n8n/workflow-sdk';

const HTML_B64 = 'PCFET0NUWVBFIGh0bWw+CjxodG1sIGxhbmc9ImRlIj4KPGhlYWQ+CiAgPG1ldGEgY2hhcnNldD0iVVRGLTgiPgogIDxtZXRhIG5hbWU9InZpZXdwb3J0IiBjb250ZW50PSJ3aWR0aD1kZXZpY2Utd2lkdGgsIGluaXRpYWwtc2NhbGU9MS4wIj4KICA8dGl0bGU+VXJsYXVic3BhY2tsaXN0ZTwvdGl0bGU+CiAgPHNjcmlwdCBzcmM9Imh0dHBzOi8vY2RuLnRhaWx3aW5kY3NzLmNvbSI+PC9zY3JpcHQ+CiAgPHNjcmlwdCBkZWZlciBzcmM9Imh0dHBzOi8vY2RuLmpzZGVsaXZyLm5ldC9ucG0vYWxwaW5lanNAMy9kaXN0L2Nkbi5taW4uanMiPjwvc2NyaXB0PgogIDxzdHlsZT4KICAgIFt4LWNsb2FrXSB7IGRpc3BsYXk6IG5vbmUgIWltcG9ydGFudDsgfQogICAgYm9keSB7IC13ZWJraXQtdGFwLWhpZ2hsaWdodC1jb2xvcjogdHJhbnNwYXJlbnQ7IH0KICA8L3N0eWxlPgo8L2hlYWQ+Cjxib2R5IGNsYXNzPSJiZy1zbGF0ZS0xMDAgbWluLWgtc2NyZWVuIHRleHQtc2xhdGUtODAwIj4KICA8ZGl2IHgtZGF0YT0icGFja2xpc3RlKCkiIHgtaW5pdD0iaW5pdCgpIiB4LWNsb2FrPgoKICAgIDxkaXYgY2xhc3M9Im1heC13LXhsIG14LWF1dG8gcHgtNCBweS02IHBiLTMyIj4KICAgICAgPCEtLSBLb3BmIC0tPgogICAgICA8aGVhZGVyIGNsYXNzPSJtYi01Ij4KICAgICAgICA8ZGl2IGNsYXNzPSJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4iPgogICAgICAgICAgPGgxIGNsYXNzPSJ0ZXh0LTJ4bCBmb250LWJvbGQgdGV4dC1zbGF0ZS05MDAiPvCfp7MgVXJsYXVic3BhY2tsaXN0ZTwvaDE+CiAgICAgICAgICA8YnV0dG9uIEBjbGljaz0ibG9hZCgpIiA6Y2xhc3M9ImxvYWRpbmcgJiYgJ2FuaW1hdGUtc3BpbiciIGNsYXNzPSJ0ZXh0LXNsYXRlLTQwMCB0ZXh0LXhsIiB0aXRsZT0iQWt0dWFsaXNpZXJlbiI+4p+zPC9idXR0b24+CiAgICAgICAgPC9kaXY+CiAgICAgICAgPHAgY2xhc3M9InRleHQtc20gdGV4dC1zbGF0ZS01MDAgbXQtMSIgeC10ZXh0PSJzdGF0dXNUZXh0KCkiPjwvcD4KICAgICAgICA8ZGl2IGNsYXNzPSJtdC0zIGgtMiB3LWZ1bGwgcm91bmRlZC1mdWxsIGJnLXNsYXRlLTIwMCBvdmVyZmxvdy1oaWRkZW4iPgogICAgICAgICAgPGRpdiBjbGFzcz0iaC1mdWxsIGJnLWVtZXJhbGQtNTAwIHRyYW5zaXRpb24tYWxsIGR1cmF0aW9uLTMwMCIgOnN0eWxlPSJgd2lkdGg6ICR7cHJvZ3Jlc3MoKX0lYCI+PC9kaXY+CiAgICAgICAgPC9kaXY+CiAgICAgIDwvaGVhZGVyPgoKICAgICAgPCEtLSBMaXN0ZSBuYWNoIEthdGVnb3JpZSAtLT4KICAgICAgPHRlbXBsYXRlIHgtZm9yPSJjYXQgaW4gY2F0ZWdvcmllcygpIiA6a2V5PSJjYXQiPgogICAgICAgIDxzZWN0aW9uIGNsYXNzPSJtYi01Ij4KICAgICAgICAgIDxoMiBjbGFzcz0idGV4dC14cyBmb250LXNlbWlib2xkIHVwcGVyY2FzZSB0cmFja2luZy13aWRlIHRleHQtc2xhdGUtNDAwIG1iLTIgcHgtMSIgeC10ZXh0PSJjYXQiPjwvaDI+CiAgICAgICAgICA8ZGl2IGNsYXNzPSJiZy13aGl0ZSByb3VuZGVkLTJ4bCBzaGFkb3ctc20gZGl2aWRlLXkgZGl2aWRlLXNsYXRlLTEwMCBvdmVyZmxvdy1oaWRkZW4iPgogICAgICAgICAgICA8dGVtcGxhdGUgeC1mb3I9Iml0ZW0gaW4gaXRlbXNJbihjYXQpIiA6a2V5PSJpdGVtLmlkIj4KICAgICAgICAgICAgICA8ZGl2IGNsYXNzPSJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMyBweC00IHB5LTMgYWN0aXZlOmJnLXNsYXRlLTUwIj4KICAgICAgICAgICAgICAgIDxidXR0b24gQGNsaWNrPSJ0b2dnbGUoaXRlbSkiCiAgICAgICAgICAgICAgICAgIDpjbGFzcz0iaXRlbS5jb21wbGV0ZWQgPyAnYmctZW1lcmFsZC01MDAgYm9yZGVyLWVtZXJhbGQtNTAwJyA6ICdib3JkZXItc2xhdGUtMzAwJyIKICAgICAgICAgICAgICAgICAgY2xhc3M9InNocmluay0wIHctNiBoLTYgcm91bmRlZC1mdWxsIGJvcmRlci0yIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRyYW5zaXRpb24tY29sb3JzIj4KICAgICAgICAgICAgICAgICAgPHNwYW4geC1zaG93PSJpdGVtLmNvbXBsZXRlZCIgY2xhc3M9InRleHQtd2hpdGUgdGV4dC1zbSI+4pyTPC9zcGFuPgogICAgICAgICAgICAgICAgPC9idXR0b24+CiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz0iZmxleC0xIHRleHQtWzE1cHhdIgogICAgICAgICAgICAgICAgICA6Y2xhc3M9Iml0ZW0uY29tcGxldGVkICYmICdsaW5lLXRocm91Z2ggdGV4dC1zbGF0ZS00MDAnIgogICAgICAgICAgICAgICAgICB4LXRleHQ9Iml0ZW0udGl0bGUiPjwvc3Bhbj4KICAgICAgICAgICAgICAgIDxidXR0b24gQGNsaWNrPSJyZW1vdmUoaXRlbSkiIGNsYXNzPSJzaHJpbmstMCB0ZXh0LXNsYXRlLTMwMCBob3Zlcjp0ZXh0LXJvc2UtNTAwIHRleHQtbGcgcHgtMSI+w5c8L2J1dHRvbj4KICAgICAgICAgICAgICA8L2Rpdj4KICAgICAgICAgICAgPC90ZW1wbGF0ZT4KICAgICAgICAgIDwvZGl2PgogICAgICAgIDwvc2VjdGlvbj4KICAgICAgPC90ZW1wbGF0ZT4KCiAgICAgIDxwIHgtc2hvdz0iaXRlbXMubGVuZ3RoID09PSAwICYmICFsb2FkaW5nIiBjbGFzcz0idGV4dC1jZW50ZXIgdGV4dC1zbGF0ZS00MDAgcHktMTAiPgogICAgICAgIE5vY2ggbmljaHRzIGRyYXVmIOKAkyBmw7xnZSB1bnRlbiBkZW4gZXJzdGVuIFB1bmt0IGhpbnp1LiDwn5GHCiAgICAgIDwvcD4KICAgIDwvZGl2PgoKICAgIDwhLS0gRWluZ2FiZWxlaXN0ZSB1bnRlbiAoZ2xlaWNoZSBLb21wb25lbnRlISkgLS0+CiAgICA8Zm9ybSBAc3VibWl0LnByZXZlbnQ9InN1Ym1pdEFkZCgpIgogICAgICBjbGFzcz0iZml4ZWQgYm90dG9tLTAgaW5zZXQteC0wIGJvcmRlci10IGJvcmRlci1zbGF0ZS0yMDAgYmctd2hpdGUvOTUgYmFja2Ryb3AtYmx1ciBweC00IHB5LTMiPgogICAgICA8ZGl2IGNsYXNzPSJtYXgtdy14bCBteC1hdXRvIGZsZXggZ2FwLTIiPgogICAgICAgIDxzZWxlY3QgeC1tb2RlbD0ibmV3Q2F0IiBjbGFzcz0icm91bmRlZC14bCBib3JkZXIgYm9yZGVyLXNsYXRlLTMwMCBiZy13aGl0ZSBweC0yIHB5LTIgdGV4dC1zbSB0ZXh0LXNsYXRlLTYwMCI+CiAgICAgICAgICA8dGVtcGxhdGUgeC1mb3I9ImMgaW4gX2NhdGVnb3JpZXMiIDprZXk9ImMiPjxvcHRpb24geC10ZXh0PSJjIiA6dmFsdWU9ImMiPjwvb3B0aW9uPjwvdGVtcGxhdGU+CiAgICAgICAgPC9zZWxlY3Q+CiAgICAgICAgPGlucHV0IHgtbW9kZWw9Im5ld1RpdGxlIiB0eXBlPSJ0ZXh0IiBwbGFjZWhvbGRlcj0iV2FzIG5vY2ggZWlucGFja2VuPyIgZW50ZXJrZXloaW50PSJkb25lIgogICAgICAgICAgY2xhc3M9ImZsZXgtMSByb3VuZGVkLXhsIGJvcmRlciBib3JkZXItc2xhdGUtMzAwIHB4LTMgcHktMiB0ZXh0LVsxNXB4XSBmb2N1czpvdXRsaW5lLW5vbmUgZm9jdXM6cmluZy0yIGZvY3VzOnJpbmctZW1lcmFsZC00MDAiPgogICAgICAgIDxidXR0b24gdHlwZT0ic3VibWl0IiBjbGFzcz0icm91bmRlZC14bCBiZy1lbWVyYWxkLTYwMCB0ZXh0LXdoaXRlIHB4LTQgcHktMiB0ZXh0LWxnIGZvbnQtbWVkaXVtIGFjdGl2ZTpiZy1lbWVyYWxkLTcwMCI+KzwvYnV0dG9uPgogICAgICA8L2Rpdj4KICAgIDwvZm9ybT4KCiAgPC9kaXY+CgogIDxzY3JpcHQgaWQ9Il9fZGF0YSIgdHlwZT0iYXBwbGljYXRpb24vanNvbiI+X19EQVRBX1BMQUNFSE9MREVSX188L3NjcmlwdD4KICA8c2NyaXB0PgogICAgY29uc3QgQ0FUUyA9IFsnRG9rdW1lbnRlJywgJ0tsZWlkdW5nJywgJ1NjaHVoZScsICdLaW5kZXInLCAnS3VsdHVyYmV1dGVsJywgJ01lZGlrYW1lbnRlJywgJ1RlY2huaWsnLCAnU3RyYW5kICYgV2Fzc2VyJywgJ1NwaWVsZScsICdWb3IgZGVyIEFicmVpc2UnLCAnU29uc3RpZ2VzJ107CgogICAgZnVuY3Rpb24gcGFja2xpc3RlKCkgewogICAgICByZXR1cm4gewogICAgICAgIGl0ZW1zOiBbXSwKICAgICAgICBsb2FkaW5nOiBmYWxzZSwKICAgICAgICBuZXdUaXRsZTogJycsCiAgICAgICAgbmV3Q2F0OiAnU29uc3RpZ2VzJywKICAgICAgICBfY2F0ZWdvcmllczogQ0FUUywKCiAgICAgICAgaW5pdCgpIHsKICAgICAgICAgIHRyeSB7CiAgICAgICAgICAgIHRoaXMuaXRlbXMgPSBKU09OLnBhcnNlKGF0b2IoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ19fZGF0YScpLnRleHRDb250ZW50KSkgfHwgW107CiAgICAgICAgICB9IGNhdGNoIChlKSB7IHRoaXMuaXRlbXMgPSBbXTsgfQogICAgICAgICAgLy8gQWxsZSB+OCBTZWsuIG5ldSBsYWRlbiwgZGFtaXQgaWhyIGJlaWRlIGRpZXNlbGJlbiBIw6RrY2hlbiBzZWh0CiAgICAgICAgICBzZXRJbnRlcnZhbCgoKSA9PiB0aGlzLmxvYWQoKSwgODAwMCk7CiAgICAgICAgfSwKICAgICAgICBjYXRlZ29yaWVzKCkgewogICAgICAgICAgY29uc3QgcHJlc2VudCA9IFsuLi5uZXcgU2V0KHRoaXMuaXRlbXMubWFwKGkgPT4gaS5jYXRlZ29yeSB8fCAnU29uc3RpZ2VzJykpXTsKICAgICAgICAgIHJldHVybiBDQVRTLmZpbHRlcihjID0+IHByZXNlbnQuaW5jbHVkZXMoYykpLmNvbmNhdChwcmVzZW50LmZpbHRlcihjID0+ICFDQVRTLmluY2x1ZGVzKGMpKSk7CiAgICAgICAgfSwKICAgICAgICBpdGVtc0luKGNhdCkgewogICAgICAgICAgcmV0dXJuIHRoaXMuaXRlbXMuZmlsdGVyKGkgPT4gKGkuY2F0ZWdvcnkgfHwgJ1NvbnN0aWdlcycpID09PSBjYXQpOwogICAgICAgIH0sCiAgICAgICAgcHJvZ3Jlc3MoKSB7CiAgICAgICAgICBpZiAoIXRoaXMuaXRlbXMubGVuZ3RoKSByZXR1cm4gMDsKICAgICAgICAgIHJldHVybiBNYXRoLnJvdW5kKDEwMCAqIHRoaXMuaXRlbXMuZmlsdGVyKGkgPT4gaS5jb21wbGV0ZWQpLmxlbmd0aCAvIHRoaXMuaXRlbXMubGVuZ3RoKTsKICAgICAgICB9LAogICAgICAgIHN0YXR1c1RleHQoKSB7CiAgICAgICAgICBjb25zdCBkb25lID0gdGhpcy5pdGVtcy5maWx0ZXIoaSA9PiBpLmNvbXBsZXRlZCkubGVuZ3RoOwogICAgICAgICAgcmV0dXJuIGAke2RvbmV9IHZvbiAke3RoaXMuaXRlbXMubGVuZ3RofSBlaW5nZXBhY2t0YDsKICAgICAgICB9LAogICAgICAgIGFzeW5jIGxvYWQoKSB7CiAgICAgICAgICB0aGlzLmxvYWRpbmcgPSB0cnVlOwogICAgICAgICAgdHJ5IHsKICAgICAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJy93ZWJob29rL3BhY2tsaXN0ZS9pdGVtcycsIHsgY2FjaGU6ICduby1zdG9yZScgfSk7CiAgICAgICAgICAgIGlmIChyZXMub2spIHRoaXMuaXRlbXMgPSBhd2FpdCByZXMuanNvbigpOwogICAgICAgICAgfSBjYXRjaCAoZSkge30gZmluYWxseSB7IHRoaXMubG9hZGluZyA9IGZhbHNlOyB9CiAgICAgICAgfSwKICAgICAgICBhc3luYyB0b2dnbGUoaXRlbSkgewogICAgICAgICAgaXRlbS5jb21wbGV0ZWQgPSAhaXRlbS5jb21wbGV0ZWQ7CiAgICAgICAgICB0cnkgewogICAgICAgICAgICBhd2FpdCBmZXRjaCgnL3dlYmhvb2svcGFja2xpc3RlL3RvZ2dsZScsIHsKICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJywgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sCiAgICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBpZDogaXRlbS5pZCwgY29tcGxldGVkOiBpdGVtLmNvbXBsZXRlZCB9KQogICAgICAgICAgICB9KTsKICAgICAgICAgIH0gY2F0Y2ggKGUpIHsgaXRlbS5jb21wbGV0ZWQgPSAhaXRlbS5jb21wbGV0ZWQ7IH0KICAgICAgICB9LAogICAgICAgIGFzeW5jIHN1Ym1pdEFkZCgpIHsKICAgICAgICAgIGNvbnN0IHRpdGxlID0gKHRoaXMubmV3VGl0bGUgfHwgJycpLnRyaW0oKTsKICAgICAgICAgIGlmICghdGl0bGUpIHJldHVybjsKICAgICAgICAgIGNvbnN0IGNhdGVnb3J5ID0gdGhpcy5uZXdDYXQgfHwgJ1NvbnN0aWdlcyc7CiAgICAgICAgICB0aGlzLm5ld1RpdGxlID0gJyc7CiAgICAgICAgICBjb25zdCBvcHRpbWlzdGljID0geyBpZDogJ3RtcC0nICsgRGF0ZS5ub3coKSwgdGl0bGU6IHRpdGxlLCBjYXRlZ29yeTogY2F0ZWdvcnksIGNvbXBsZXRlZDogZmFsc2UgfTsKICAgICAgICAgIHRoaXMuaXRlbXMucHVzaChvcHRpbWlzdGljKTsKICAgICAgICAgIHRyeSB7CiAgICAgICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCcvd2ViaG9vay9wYWNrbGlzdGUvYWRkJywgewogICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLCBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSwKICAgICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHRpdGxlOiB0aXRsZSwgY2F0ZWdvcnk6IGNhdGVnb3J5IH0pCiAgICAgICAgICAgIH0pOwogICAgICAgICAgICBpZiAocmVzLm9rKSB7CiAgICAgICAgICAgICAgY29uc3QgY3JlYXRlZCA9IGF3YWl0IHJlcy5qc29uKCk7CiAgICAgICAgICAgICAgY29uc3Qgcm93ID0gQXJyYXkuaXNBcnJheShjcmVhdGVkKSA/IGNyZWF0ZWRbMF0gOiBjcmVhdGVkOwogICAgICAgICAgICAgIGlmIChyb3cgJiYgcm93LmlkKSBPYmplY3QuYXNzaWduKG9wdGltaXN0aWMsIHJvdyk7CiAgICAgICAgICAgIH0KICAgICAgICAgIH0gY2F0Y2ggKGUpIHt9CiAgICAgICAgfSwKICAgICAgICBhc3luYyByZW1vdmUoaXRlbSkgewogICAgICAgICAgdGhpcy5pdGVtcyA9IHRoaXMuaXRlbXMuZmlsdGVyKGkgPT4gaS5pZCAhPT0gaXRlbS5pZCk7CiAgICAgICAgICB0cnkgewogICAgICAgICAgICBhd2FpdCBmZXRjaCgnL3dlYmhvb2svcGFja2xpc3RlL2RlbGV0ZScsIHsKICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJywgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sCiAgICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBpZDogaXRlbS5pZCB9KQogICAgICAgICAgICB9KTsKICAgICAgICAgIH0gY2F0Y2ggKGUpIHt9CiAgICAgICAgfQogICAgICB9OwogICAgfQogIDwvc2NyaXB0Pgo8L2JvZHk+CjwvaHRtbD4K';
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
