import { workflow, node, trigger, expr } from '@n8n/workflow-sdk';

const HTML_B64 = 'PCFET0NUWVBFIGh0bWw+CjxodG1sIGxhbmc9ImRlIj4KPGhlYWQ+CiAgPG1ldGEgY2hhcnNldD0iVVRGLTgiPgogIDxtZXRhIG5hbWU9InZpZXdwb3J0IiBjb250ZW50PSJ3aWR0aD1kZXZpY2Utd2lkdGgsIGluaXRpYWwtc2NhbGU9MS4wIj4KICA8dGl0bGU+VXJsYXVic3BhY2tsaXN0ZTwvdGl0bGU+CiAgPHNjcmlwdCBzcmM9Imh0dHBzOi8vY2RuLnRhaWx3aW5kY3NzLmNvbSI+PC9zY3JpcHQ+CiAgPHNjcmlwdCBkZWZlciBzcmM9Imh0dHBzOi8vY2RuLmpzZGVsaXZyLm5ldC9ucG0vYWxwaW5lanNAMy9kaXN0L2Nkbi5taW4uanMiPjwvc2NyaXB0PgogIDxzY3JpcHQgc3JjPSJodHRwczovL2Nkbi5qc2RlbGl2ci5uZXQvbnBtL3NvcnRhYmxlanNAMS4xNS42L1NvcnRhYmxlLm1pbi5qcyI+PC9zY3JpcHQ+CiAgPHN0eWxlPgogICAgW3gtY2xvYWtdIHsgZGlzcGxheTogbm9uZSAhaW1wb3J0YW50OyB9CiAgICBib2R5IHsgLXdlYmtpdC10YXAtaGlnaGxpZ2h0LWNvbG9yOiB0cmFuc3BhcmVudDsgfQogICAgLnNvcnRhYmxlLWdob3N0IHsgb3BhY2l0eTogLjQ7IH0KICAgIC5zb3J0YWJsZS1jaG9zZW4geyBiYWNrZ3JvdW5kOiAjZjFmNWY5OyB9CiAgICAuZHJhZy1oYW5kbGUgeyB0b3VjaC1hY3Rpb246IG5vbmU7IGN1cnNvcjogZ3JhYjsgfQogIDwvc3R5bGU+CjwvaGVhZD4KPGJvZHkgY2xhc3M9ImJnLXNsYXRlLTEwMCBtaW4taC1zY3JlZW4gdGV4dC1zbGF0ZS04MDAiPgogIDxkaXYgeC1kYXRhPSJwYWNrbGlzdGUoKSIgeC1pbml0PSJpbml0KCkiIHgtY2xvYWs+CgogICAgPGRpdiBjbGFzcz0ibWF4LXcteGwgbXgtYXV0byBweC00IHB5LTYgcGItMzIiPgogICAgICA8IS0tIEtvcGYgLS0+CiAgICAgIDxoZWFkZXIgY2xhc3M9Im1iLTQiPgogICAgICAgIDxkaXYgY2xhc3M9ImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiI+CiAgICAgICAgICA8aDEgY2xhc3M9InRleHQtMnhsIGZvbnQtYm9sZCB0ZXh0LXNsYXRlLTkwMCI+8J+nsyBVcmxhdWJzcGFja2xpc3RlPC9oMT4KICAgICAgICAgIDxidXR0b24gQGNsaWNrPSJsb2FkKCkiIDpjbGFzcz0ibG9hZGluZyAmJiAnYW5pbWF0ZS1zcGluJyIgY2xhc3M9InRleHQtc2xhdGUtNDAwIHRleHQteGwiIHRpdGxlPSJBa3R1YWxpc2llcmVuIj7in7M8L2J1dHRvbj4KICAgICAgICA8L2Rpdj4KICAgICAgICA8cCBjbGFzcz0idGV4dC1zbSB0ZXh0LXNsYXRlLTUwMCBtdC0xIiB4LXRleHQ9InN0YXR1c1RleHQoKSI+PC9wPgogICAgICAgIDxkaXYgY2xhc3M9Im10LTMgaC0yIHctZnVsbCByb3VuZGVkLWZ1bGwgYmctc2xhdGUtMjAwIG92ZXJmbG93LWhpZGRlbiI+CiAgICAgICAgICA8ZGl2IGNsYXNzPSJoLWZ1bGwgYmctZW1lcmFsZC01MDAgdHJhbnNpdGlvbi1hbGwgZHVyYXRpb24tMzAwIiA6c3R5bGU9ImB3aWR0aDogJHtwcm9ncmVzcygpfSVgIj48L2Rpdj4KICAgICAgICA8L2Rpdj4KICAgICAgICA8cCBjbGFzcz0idGV4dC1bMTFweF0gdGV4dC1zbGF0ZS00MDAgbXQtMiI+VGlwcDogYXVmIGRlbiBUZXh0IHRpcHBlbiB6dW0gVW1iZW5lbm5lbiDCtyBhbSDioL8gemllaGVuLCB1bSBpbiBlaW5lIGFuZGVyZSBSdWJyaWsgenUgc2NoaWViZW4uPC9wPgogICAgICA8L2hlYWRlcj4KCiAgICAgIDwhLS0gTGlzdGUgbmFjaCBLYXRlZ29yaWUgLS0+CiAgICAgIDx0ZW1wbGF0ZSB4LWZvcj0iY2F0IGluIGNhdGVnb3JpZXMoKSIgOmtleT0iY2F0Ij4KICAgICAgICA8c2VjdGlvbiBjbGFzcz0ibWItNSI+CiAgICAgICAgICA8aDIgY2xhc3M9InRleHQteHMgZm9udC1zZW1pYm9sZCB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZSB0ZXh0LXNsYXRlLTQwMCBtYi0yIHB4LTEiIHgtdGV4dD0iY2F0Ij48L2gyPgogICAgICAgICAgPGRpdiBjbGFzcz0iY2F0LWxpc3QgYmctd2hpdGUgcm91bmRlZC0yeGwgc2hhZG93LXNtIGRpdmlkZS15IGRpdmlkZS1zbGF0ZS0xMDAgb3ZlcmZsb3ctaGlkZGVuIgogICAgICAgICAgICAgICA6ZGF0YS1jYXRlZ29yeT0iY2F0IiB4LWluaXQ9ImluaXRTb3J0YWJsZSgkZWwpIj4KICAgICAgICAgICAgPHRlbXBsYXRlIHgtZm9yPSJpdGVtIGluIGl0ZW1zSW4oY2F0KSIgOmtleT0iaXRlbS5pZCI+CiAgICAgICAgICAgICAgPGRpdiBjbGFzcz0iZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgcHgtMyBweS0zIGFjdGl2ZTpiZy1zbGF0ZS01MCIgOmRhdGEtaWQ9Iml0ZW0uaWQiPgogICAgICAgICAgICAgICAgPHNwYW4geC1zaG93PSJlZGl0aW5nSWQgIT09IGl0ZW0uaWQiIGNsYXNzPSJkcmFnLWhhbmRsZSBzaHJpbmstMCB0ZXh0LXNsYXRlLTMwMCB0ZXh0LWxnIHNlbGVjdC1ub25lIHB4LTEiPuKgvzwvc3Bhbj4KICAgICAgICAgICAgICAgIDxidXR0b24geC1zaG93PSJlZGl0aW5nSWQgIT09IGl0ZW0uaWQiIEBjbGljaz0idG9nZ2xlKGl0ZW0pIgogICAgICAgICAgICAgICAgICA6Y2xhc3M9Iml0ZW0uY29tcGxldGVkID8gJ2JnLWVtZXJhbGQtNTAwIGJvcmRlci1lbWVyYWxkLTUwMCcgOiAnYm9yZGVyLXNsYXRlLTMwMCciCiAgICAgICAgICAgICAgICAgIGNsYXNzPSJzaHJpbmstMCB3LTYgaC02IHJvdW5kZWQtZnVsbCBib3JkZXItMiBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciB0cmFuc2l0aW9uLWNvbG9ycyI+CiAgICAgICAgICAgICAgICAgIDxzcGFuIHgtc2hvdz0iaXRlbS5jb21wbGV0ZWQiIGNsYXNzPSJ0ZXh0LXdoaXRlIHRleHQtc20iPuKckzwvc3Bhbj4KICAgICAgICAgICAgICAgIDwvYnV0dG9uPgoKICAgICAgICAgICAgICAgIDwhLS0gQW56ZWlnZSAtLT4KICAgICAgICAgICAgICAgIDxzcGFuIHgtc2hvdz0iZWRpdGluZ0lkICE9PSBpdGVtLmlkIgogICAgICAgICAgICAgICAgICBAY2xpY2s9InN0YXJ0RWRpdChpdGVtKSIKICAgICAgICAgICAgICAgICAgY2xhc3M9ImZsZXgtMSB0ZXh0LVsxNXB4XSBjdXJzb3ItdGV4dCIKICAgICAgICAgICAgICAgICAgOmNsYXNzPSJpdGVtLmNvbXBsZXRlZCAmJiAnbGluZS10aHJvdWdoIHRleHQtc2xhdGUtNDAwJyIKICAgICAgICAgICAgICAgICAgeC10ZXh0PSJpdGVtLnRpdGxlIj48L3NwYW4+CiAgICAgICAgICAgICAgICA8YnV0dG9uIHgtc2hvdz0iZWRpdGluZ0lkICE9PSBpdGVtLmlkIiBAY2xpY2s9InJlbW92ZShpdGVtKSIgY2xhc3M9InNocmluay0wIHRleHQtc2xhdGUtMzAwIGhvdmVyOnRleHQtcm9zZS01MDAgdGV4dC1sZyBweC0xIj7DlzwvYnV0dG9uPgoKICAgICAgICAgICAgICAgIDwhLS0gQmVhcmJlaXRlbjogVGV4dCB1bXNjaHJlaWJlbiArIEthdGVnb3JpZSB3ZWNoc2VsbiAtLT4KICAgICAgICAgICAgICAgIDxkaXYgeC1zaG93PSJlZGl0aW5nSWQgPT09IGl0ZW0uaWQiIGNsYXNzPSJmbGV4LTEgZmxleCBmbGV4LWNvbCBnYXAtMSIgQGNsaWNrLnN0b3A+CiAgICAgICAgICAgICAgICAgIDxpbnB1dCB4LW1vZGVsPSJlZGl0VGV4dCIKICAgICAgICAgICAgICAgICAgICBAa2V5ZG93bi5lbnRlcj0ic2F2ZUVkaXQoaXRlbSkiIEBrZXlkb3duLmVzY2FwZT0iY2FuY2VsRWRpdCgpIgogICAgICAgICAgICAgICAgICAgIHgtcmVmPSJlZGl0IgogICAgICAgICAgICAgICAgICAgIGNsYXNzPSJ3LWZ1bGwgdGV4dC1bMTVweF0gYm9yZGVyIGJvcmRlci1lbWVyYWxkLTQwMCByb3VuZGVkIHB4LTIgcHktMSBmb2N1czpvdXRsaW5lLW5vbmUiPgogICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPSJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiI+CiAgICAgICAgICAgICAgICAgICAgPHNlbGVjdCB4LW1vZGVsPSJpdGVtLmNhdGVnb3J5IiBAY2hhbmdlPSJwZXJzaXN0KGl0ZW0pIgogICAgICAgICAgICAgICAgICAgICAgY2xhc3M9ImZsZXgtMSB0ZXh0LXNtIGJvcmRlciBib3JkZXItc2xhdGUtMzAwIHJvdW5kZWQgcHgtMiBweS0xIGJnLXdoaXRlIHRleHQtc2xhdGUtNjAwIj4KICAgICAgICAgICAgICAgICAgICAgIDx0ZW1wbGF0ZSB4LWZvcj0iYyBpbiBfY2F0ZWdvcmllcyIgOmtleT0iYyI+PG9wdGlvbiA6dmFsdWU9ImMiIHgtdGV4dD0iYyI+PC9vcHRpb24+PC90ZW1wbGF0ZT4KICAgICAgICAgICAgICAgICAgICA8L3NlbGVjdD4KICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIEBjbGljaz0ic2F2ZUVkaXQoaXRlbSkiIGNsYXNzPSJzaHJpbmstMCByb3VuZGVkIGJnLWVtZXJhbGQtNjAwIHRleHQtd2hpdGUgdGV4dC1zbSBweC0zIHB5LTEiPkZlcnRpZzwvYnV0dG9uPgogICAgICAgICAgICAgICAgICA8L2Rpdj4KICAgICAgICAgICAgICAgIDwvZGl2PgogICAgICAgICAgICAgIDwvZGl2PgogICAgICAgICAgICA8L3RlbXBsYXRlPgogICAgICAgICAgPC9kaXY+CiAgICAgICAgPC9zZWN0aW9uPgogICAgICA8L3RlbXBsYXRlPgoKICAgICAgPHAgeC1zaG93PSJpdGVtcy5sZW5ndGggPT09IDAgJiYgIWxvYWRpbmciIGNsYXNzPSJ0ZXh0LWNlbnRlciB0ZXh0LXNsYXRlLTQwMCBweS0xMCI+CiAgICAgICAgTm9jaCBuaWNodHMgZHJhdWYg4oCTIGbDvGdlIHVudGVuIGRlbiBlcnN0ZW4gUHVua3QgaGluenUuIPCfkYcKICAgICAgPC9wPgogICAgPC9kaXY+CgogICAgPCEtLSBFaW5nYWJlbGVpc3RlIHVudGVuIC0tPgogICAgPGZvcm0gQHN1Ym1pdC5wcmV2ZW50PSJzdWJtaXRBZGQoKSIKICAgICAgY2xhc3M9ImZpeGVkIGJvdHRvbS0wIGluc2V0LXgtMCBib3JkZXItdCBib3JkZXItc2xhdGUtMjAwIGJnLXdoaXRlLzk1IGJhY2tkcm9wLWJsdXIgcHgtNCBweS0zIj4KICAgICAgPGRpdiBjbGFzcz0ibWF4LXcteGwgbXgtYXV0byBmbGV4IGdhcC0yIj4KICAgICAgICA8c2VsZWN0IHgtbW9kZWw9Im5ld0NhdCIgY2xhc3M9InJvdW5kZWQteGwgYm9yZGVyIGJvcmRlci1zbGF0ZS0zMDAgYmctd2hpdGUgcHgtMiBweS0yIHRleHQtc20gdGV4dC1zbGF0ZS02MDAiPgogICAgICAgICAgPHRlbXBsYXRlIHgtZm9yPSJjIGluIF9jYXRlZ29yaWVzIiA6a2V5PSJjIj48b3B0aW9uIHgtdGV4dD0iYyIgOnZhbHVlPSJjIj48L29wdGlvbj48L3RlbXBsYXRlPgogICAgICAgIDwvc2VsZWN0PgogICAgICAgIDxpbnB1dCB4LW1vZGVsPSJuZXdUaXRsZSIgdHlwZT0idGV4dCIgcGxhY2Vob2xkZXI9IldhcyBub2NoIGVpbnBhY2tlbj8iIGVudGVya2V5aGludD0iZG9uZSIKICAgICAgICAgIGNsYXNzPSJmbGV4LTEgcm91bmRlZC14bCBib3JkZXIgYm9yZGVyLXNsYXRlLTMwMCBweC0zIHB5LTIgdGV4dC1bMTVweF0gZm9jdXM6b3V0bGluZS1ub25lIGZvY3VzOnJpbmctMiBmb2N1czpyaW5nLWVtZXJhbGQtNDAwIj4KICAgICAgICA8YnV0dG9uIHR5cGU9InN1Ym1pdCIgY2xhc3M9InJvdW5kZWQteGwgYmctZW1lcmFsZC02MDAgdGV4dC13aGl0ZSBweC00IHB5LTIgdGV4dC1sZyBmb250LW1lZGl1bSBhY3RpdmU6YmctZW1lcmFsZC03MDAiPis8L2J1dHRvbj4KICAgICAgPC9kaXY+CiAgICA8L2Zvcm0+CgogIDwvZGl2PgoKICA8c2NyaXB0IGlkPSJfX2RhdGEiIHR5cGU9ImFwcGxpY2F0aW9uL2pzb24iPl9fREFUQV9QTEFDRUhPTERFUl9fPC9zY3JpcHQ+CiAgPHNjcmlwdD4KICAgIGNvbnN0IENBVFMgPSBbJ0Rva3VtZW50ZScsICdLbGVpZHVuZycsICdTY2h1aGUnLCAnUmFuamEnLCAnVGFyZWsnLCAnS3VsdHVyYmV1dGVsJywgJ01lZGlrYW1lbnRlJywgJ1N1cHBsZW1lbnRzJywgJ1RlY2huaWsnLCAnU3RyYW5kICYgV2Fzc2VyJywgJ1NwaWVsZScsICdWb3IgZGVyIEFicmVpc2UnLCAnU29uc3RpZ2VzJ107CgogICAgZnVuY3Rpb24gcGFja2xpc3RlKCkgewogICAgICByZXR1cm4gewogICAgICAgIGl0ZW1zOiBbXSwKICAgICAgICBsb2FkaW5nOiBmYWxzZSwKICAgICAgICBkcmFnZ2luZzogZmFsc2UsCiAgICAgICAgZWRpdGluZ0lkOiBudWxsLAogICAgICAgIGVkaXRUZXh0OiAnJywKICAgICAgICBuZXdUaXRsZTogJycsCiAgICAgICAgbmV3Q2F0OiAnU29uc3RpZ2VzJywKICAgICAgICBfY2F0ZWdvcmllczogQ0FUUywKCiAgICAgICAgaW5pdCgpIHsKICAgICAgICAgIHRyeSB7CiAgICAgICAgICAgIHRoaXMuaXRlbXMgPSBKU09OLnBhcnNlKGF0b2IoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ19fZGF0YScpLnRleHRDb250ZW50KSkgfHwgW107CiAgICAgICAgICB9IGNhdGNoIChlKSB7IHRoaXMuaXRlbXMgPSBbXTsgfQogICAgICAgICAgLy8gQWxsZSB+OCBTZWsuIG5ldSBsYWRlbiwgZGFtaXQgaWhyIGJlaWRlIGRpZXNlbGJlbiBIw6RrY2hlbiBzZWh0CiAgICAgICAgICBzZXRJbnRlcnZhbCgoKSA9PiB0aGlzLmxvYWQoKSwgODAwMCk7CiAgICAgICAgfSwKICAgICAgICBjYXRlZ29yaWVzKCkgewogICAgICAgICAgY29uc3QgcHJlc2VudCA9IFsuLi5uZXcgU2V0KHRoaXMuaXRlbXMubWFwKGkgPT4gaS5jYXRlZ29yeSB8fCAnU29uc3RpZ2VzJykpXTsKICAgICAgICAgIHJldHVybiBDQVRTLmZpbHRlcihjID0+IHByZXNlbnQuaW5jbHVkZXMoYykpLmNvbmNhdChwcmVzZW50LmZpbHRlcihjID0+ICFDQVRTLmluY2x1ZGVzKGMpKSk7CiAgICAgICAgfSwKICAgICAgICBpdGVtc0luKGNhdCkgewogICAgICAgICAgcmV0dXJuIHRoaXMuaXRlbXMuZmlsdGVyKGkgPT4gKGkuY2F0ZWdvcnkgfHwgJ1NvbnN0aWdlcycpID09PSBjYXQpOwogICAgICAgIH0sCiAgICAgICAgcHJvZ3Jlc3MoKSB7CiAgICAgICAgICBpZiAoIXRoaXMuaXRlbXMubGVuZ3RoKSByZXR1cm4gMDsKICAgICAgICAgIHJldHVybiBNYXRoLnJvdW5kKDEwMCAqIHRoaXMuaXRlbXMuZmlsdGVyKGkgPT4gaS5jb21wbGV0ZWQpLmxlbmd0aCAvIHRoaXMuaXRlbXMubGVuZ3RoKTsKICAgICAgICB9LAogICAgICAgIHN0YXR1c1RleHQoKSB7CiAgICAgICAgICBjb25zdCBkb25lID0gdGhpcy5pdGVtcy5maWx0ZXIoaSA9PiBpLmNvbXBsZXRlZCkubGVuZ3RoOwogICAgICAgICAgcmV0dXJuIGAke2RvbmV9IHZvbiAke3RoaXMuaXRlbXMubGVuZ3RofSBlaW5nZXBhY2t0YDsKICAgICAgICB9LAoKICAgICAgICAvLyBEcmFnICYgRHJvcCDigJMgVmVyc2NoaWViZW4gendpc2NoZW4gUnVicmlrZW4KICAgICAgICBpbml0U29ydGFibGUoZWwpIHsKICAgICAgICAgIGlmICghd2luZG93LlNvcnRhYmxlIHx8IGVsLl9zb3J0YWJsZVJlYWR5KSByZXR1cm47CiAgICAgICAgICBlbC5fc29ydGFibGVSZWFkeSA9IHRydWU7CiAgICAgICAgICBjb25zdCBzZWxmID0gdGhpczsKICAgICAgICAgIFNvcnRhYmxlLmNyZWF0ZShlbCwgewogICAgICAgICAgICBncm91cDogJ3BhY2tsaXN0ZScsCiAgICAgICAgICAgIGhhbmRsZTogJy5kcmFnLWhhbmRsZScsCiAgICAgICAgICAgIGZvcmNlRmFsbGJhY2s6IHRydWUsCiAgICAgICAgICAgIGZhbGxiYWNrVG9sZXJhbmNlOiA1LAogICAgICAgICAgICBhbmltYXRpb246IDE1MCwKICAgICAgICAgICAgZ2hvc3RDbGFzczogJ3NvcnRhYmxlLWdob3N0JywKICAgICAgICAgICAgY2hvc2VuQ2xhc3M6ICdzb3J0YWJsZS1jaG9zZW4nLAogICAgICAgICAgICBvblN0YXJ0KCkgeyBzZWxmLmRyYWdnaW5nID0gdHJ1ZTsgfSwKICAgICAgICAgICAgb25FbmQoZXZ0KSB7CiAgICAgICAgICAgICAgc2VsZi5kcmFnZ2luZyA9IGZhbHNlOwogICAgICAgICAgICAgIGNvbnN0IGlkID0gZXZ0Lml0ZW0uZ2V0QXR0cmlidXRlKCdkYXRhLWlkJyk7CiAgICAgICAgICAgICAgY29uc3QgdG9DYXQgPSBldnQudG8gJiYgZXZ0LnRvLmdldEF0dHJpYnV0ZSgnZGF0YS1jYXRlZ29yeScpOwogICAgICAgICAgICAgIGNvbnN0IGZyb21DYXQgPSBldnQuZnJvbSAmJiBldnQuZnJvbS5nZXRBdHRyaWJ1dGUoJ2RhdGEtY2F0ZWdvcnknKTsKICAgICAgICAgICAgICBpZiAodG9DYXQgJiYgZnJvbUNhdCAmJiB0b0NhdCAhPT0gZnJvbUNhdCkgewogICAgICAgICAgICAgICAgLy8gQWxwaW5lIGJsZWlidCBkaWUgUXVlbGxlIGRlciBXYWhyaGVpdDogdm9uIFNvcnRhYmxlIGVpbmdlZsO8Z3RlbiBLbm90ZW4gZW50ZmVybmVuCiAgICAgICAgICAgICAgICBldnQuaXRlbS5yZW1vdmUoKTsKICAgICAgICAgICAgICAgIGNvbnN0IGl0ID0gc2VsZi5pdGVtcy5maW5kKHggPT4gU3RyaW5nKHguaWQpID09PSBTdHJpbmcoaWQpKTsKICAgICAgICAgICAgICAgIGlmIChpdCkgeyBpdC5jYXRlZ29yeSA9IHRvQ2F0OyBzZWxmLnBlcnNpc3QoaXQpOyB9CiAgICAgICAgICAgICAgfQogICAgICAgICAgICB9CiAgICAgICAgICB9KTsKICAgICAgICB9LAoKICAgICAgICBhc3luYyBsb2FkKCkgewogICAgICAgICAgaWYgKHRoaXMuZWRpdGluZ0lkICE9PSBudWxsIHx8IHRoaXMuZHJhZ2dpbmcpIHJldHVybjsgLy8gbmljaHQgbWl0dGVuIGltIEJlYXJiZWl0ZW4vWmllaGVuIG5ldSBsYWRlbgogICAgICAgICAgdGhpcy5sb2FkaW5nID0gdHJ1ZTsKICAgICAgICAgIHRyeSB7CiAgICAgICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCcvd2ViaG9vay9wYWNrbGlzdGUvaXRlbXMnLCB7IGNhY2hlOiAnbm8tc3RvcmUnIH0pOwogICAgICAgICAgICBpZiAocmVzLm9rKSB0aGlzLml0ZW1zID0gYXdhaXQgcmVzLmpzb24oKTsKICAgICAgICAgIH0gY2F0Y2ggKGUpIHt9IGZpbmFsbHkgeyB0aGlzLmxvYWRpbmcgPSBmYWxzZTsgfQogICAgICAgIH0sCiAgICAgICAgYXN5bmMgdG9nZ2xlKGl0ZW0pIHsKICAgICAgICAgIGl0ZW0uY29tcGxldGVkID0gIWl0ZW0uY29tcGxldGVkOwogICAgICAgICAgdHJ5IHsKICAgICAgICAgICAgYXdhaXQgZmV0Y2goJy93ZWJob29rL3BhY2tsaXN0ZS90b2dnbGUnLCB7CiAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LAogICAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgaWQ6IGl0ZW0uaWQsIGNvbXBsZXRlZDogaXRlbS5jb21wbGV0ZWQgfSkKICAgICAgICAgICAgfSk7CiAgICAgICAgICB9IGNhdGNoIChlKSB7IGl0ZW0uY29tcGxldGVkID0gIWl0ZW0uY29tcGxldGVkOyB9CiAgICAgICAgfSwKCiAgICAgICAgLy8gQmVhcmJlaXRlbiBkZXMgVGV4dGVzCiAgICAgICAgc3RhcnRFZGl0KGl0ZW0pIHsKICAgICAgICAgIGlmICh0eXBlb2YgaXRlbS5pZCA9PT0gJ3N0cmluZycgJiYgaXRlbS5pZC5zdGFydHNXaXRoKCd0bXAtJykpIHJldHVybjsgLy8gZXJzdCBuYWNoIGRlbSBTcGVpY2hlcm4KICAgICAgICAgIHRoaXMuZWRpdGluZ0lkID0gaXRlbS5pZDsKICAgICAgICAgIHRoaXMuZWRpdFRleHQgPSBpdGVtLnRpdGxlOwogICAgICAgICAgdGhpcy4kbmV4dFRpY2soKCkgPT4geyBpZiAodGhpcy4kcmVmcy5lZGl0KSB7IHRoaXMuJHJlZnMuZWRpdC5mb2N1cygpOyB0aGlzLiRyZWZzLmVkaXQuc2VsZWN0KCk7IH0gfSk7CiAgICAgICAgfSwKICAgICAgICBjYW5jZWxFZGl0KCkgeyB0aGlzLmVkaXRpbmdJZCA9IG51bGw7IHRoaXMuZWRpdFRleHQgPSAnJzsgfSwKICAgICAgICBhc3luYyBzYXZlRWRpdChpdGVtKSB7CiAgICAgICAgICBpZiAodGhpcy5lZGl0aW5nSWQgIT09IGl0ZW0uaWQpIHJldHVybjsKICAgICAgICAgIGNvbnN0IHQgPSAodGhpcy5lZGl0VGV4dCB8fCAnJykudHJpbSgpOwogICAgICAgICAgdGhpcy5lZGl0aW5nSWQgPSBudWxsOwogICAgICAgICAgaWYgKHQgJiYgdCAhPT0gaXRlbS50aXRsZSkgewogICAgICAgICAgICBpdGVtLnRpdGxlID0gdDsKICAgICAgICAgICAgdGhpcy5wZXJzaXN0KGl0ZW0pOwogICAgICAgICAgfQogICAgICAgIH0sCgogICAgICAgIC8vIMOEbmRlcnVuZyAoVGl0ZWwgdW5kL29kZXIgS2F0ZWdvcmllKSBzcGVpY2hlcm4KICAgICAgICBhc3luYyBwZXJzaXN0KGl0ZW0pIHsKICAgICAgICAgIHRyeSB7CiAgICAgICAgICAgIGF3YWl0IGZldGNoKCcvd2ViaG9vay9wYWNrbGlzdGUvdXBkYXRlJywgewogICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLCBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSwKICAgICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGlkOiBpdGVtLmlkLCB0aXRsZTogaXRlbS50aXRsZSwgY2F0ZWdvcnk6IGl0ZW0uY2F0ZWdvcnkgfSkKICAgICAgICAgICAgfSk7CiAgICAgICAgICB9IGNhdGNoIChlKSB7fQogICAgICAgIH0sCgogICAgICAgIGFzeW5jIHN1Ym1pdEFkZCgpIHsKICAgICAgICAgIGNvbnN0IHRpdGxlID0gKHRoaXMubmV3VGl0bGUgfHwgJycpLnRyaW0oKTsKICAgICAgICAgIGlmICghdGl0bGUpIHJldHVybjsKICAgICAgICAgIGNvbnN0IGNhdGVnb3J5ID0gdGhpcy5uZXdDYXQgfHwgJ1NvbnN0aWdlcyc7CiAgICAgICAgICB0aGlzLm5ld1RpdGxlID0gJyc7CiAgICAgICAgICBjb25zdCBvcHRpbWlzdGljID0geyBpZDogJ3RtcC0nICsgRGF0ZS5ub3coKSwgdGl0bGU6IHRpdGxlLCBjYXRlZ29yeTogY2F0ZWdvcnksIGNvbXBsZXRlZDogZmFsc2UgfTsKICAgICAgICAgIHRoaXMuaXRlbXMucHVzaChvcHRpbWlzdGljKTsKICAgICAgICAgIHRyeSB7CiAgICAgICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCcvd2ViaG9vay9wYWNrbGlzdGUvYWRkJywgewogICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLCBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSwKICAgICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHRpdGxlOiB0aXRsZSwgY2F0ZWdvcnk6IGNhdGVnb3J5IH0pCiAgICAgICAgICAgIH0pOwogICAgICAgICAgICBpZiAocmVzLm9rKSB7CiAgICAgICAgICAgICAgY29uc3QgY3JlYXRlZCA9IGF3YWl0IHJlcy5qc29uKCk7CiAgICAgICAgICAgICAgY29uc3Qgcm93ID0gQXJyYXkuaXNBcnJheShjcmVhdGVkKSA/IGNyZWF0ZWRbMF0gOiBjcmVhdGVkOwogICAgICAgICAgICAgIGlmIChyb3cgJiYgcm93LmlkKSBPYmplY3QuYXNzaWduKG9wdGltaXN0aWMsIHJvdyk7CiAgICAgICAgICAgIH0KICAgICAgICAgIH0gY2F0Y2ggKGUpIHt9CiAgICAgICAgfSwKICAgICAgICBhc3luYyByZW1vdmUoaXRlbSkgewogICAgICAgICAgdGhpcy5pdGVtcyA9IHRoaXMuaXRlbXMuZmlsdGVyKGkgPT4gaS5pZCAhPT0gaXRlbS5pZCk7CiAgICAgICAgICB0cnkgewogICAgICAgICAgICBhd2FpdCBmZXRjaCgnL3dlYmhvb2svcGFja2xpc3RlL2RlbGV0ZScsIHsKICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJywgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sCiAgICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBpZDogaXRlbS5pZCB9KQogICAgICAgICAgICB9KTsKICAgICAgICAgIH0gY2F0Y2ggKGUpIHt9CiAgICAgICAgfQogICAgICB9OwogICAgfQogIDwvc2NyaXB0Pgo8L2JvZHk+CjwvaHRtbD4K';
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

const updateWebhook = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: { name: 'POST Update', parameters: { httpMethod: 'POST', path: 'packliste/update', responseMode: 'responseNode', options: {} } },
  output: [{ body: { id: 1, title: 'Neuer Titel', category: 'Sonstiges' } }]
});
const updateEntry = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Eintrag aktualisieren',
    parameters: {
      resource: 'row',
      operation: 'update',
      dataTableId: { __rl: true, mode: 'name', value: TABLE },
      matchType: 'allConditions',
      filters: { conditions: [{ keyName: 'id', condition: 'eq', keyValue: expr('{{ $json.body.id }}') }] },
      columns: {
        mappingMode: 'defineBelow',
        value: { title: expr('{{ $json.body.title }}'), category: expr('{{ $json.body.category }}') },
        schema: [
          { id: 'title', displayName: 'title', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
          { id: 'category', displayName: 'category', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false }
        ]
      },
      options: {}
    }
  },
  output: [{ id: 1, title: 'Neuer Titel', category: 'Sonstiges' }]
});
const respondUpdate = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: { name: 'Update Antwort', parameters: { respondWith: 'allIncomingItems', options: {} } },
  output: [{}]
});

export default workflow('packliste-app', 'Urlaubspackliste (geteilte Liste)')
  .add(pageWebhook).to(getRowsForPage).to(aggregateRows).to(buildPage).to(respondPage)
  .add(itemsWebhook).to(getRowsJson).to(respondItems)
  .add(toggleWebhook).to(updateRow).to(respondToggle)
  .add(addWebhook).to(insertRow).to(respondAdd)
  .add(deleteWebhook).to(deleteRow).to(respondDelete)
  .add(updateWebhook).to(updateEntry).to(respondUpdate);
