import { workflow, node, trigger, expr } from '@n8n/workflow-sdk';

const HTML_B64 = 'PCFET0NUWVBFIGh0bWw+CjxodG1sIGxhbmc9ImRlIj4KPGhlYWQ+CiAgPG1ldGEgY2hhcnNldD0iVVRGLTgiPgogIDxtZXRhIG5hbWU9InZpZXdwb3J0IiBjb250ZW50PSJ3aWR0aD1kZXZpY2Utd2lkdGgsIGluaXRpYWwtc2NhbGU9MS4wIj4KICA8dGl0bGU+VXJsYXVic3BhY2tsaXN0ZTwvdGl0bGU+CiAgPHNjcmlwdCBzcmM9Imh0dHBzOi8vY2RuLnRhaWx3aW5kY3NzLmNvbSI+PC9zY3JpcHQ+CiAgPHNjcmlwdCBkZWZlciBzcmM9Imh0dHBzOi8vY2RuLmpzZGVsaXZyLm5ldC9ucG0vYWxwaW5lanNAMy9kaXN0L2Nkbi5taW4uanMiPjwvc2NyaXB0PgogIDxzY3JpcHQgc3JjPSJodHRwczovL2Nkbi5qc2RlbGl2ci5uZXQvbnBtL3NvcnRhYmxlanNAMS4xNS42L1NvcnRhYmxlLm1pbi5qcyI+PC9zY3JpcHQ+CiAgPHN0eWxlPgogICAgW3gtY2xvYWtdIHsgZGlzcGxheTogbm9uZSAhaW1wb3J0YW50OyB9CiAgICBib2R5IHsgLXdlYmtpdC10YXAtaGlnaGxpZ2h0LWNvbG9yOiB0cmFuc3BhcmVudDsgfQogICAgLnNvcnRhYmxlLWdob3N0IHsgb3BhY2l0eTogLjQ7IH0KICAgIC5zb3J0YWJsZS1jaG9zZW4geyBiYWNrZ3JvdW5kOiAjZjFmNWY5OyB9CiAgICAuZHJhZy1oYW5kbGUgeyB0b3VjaC1hY3Rpb246IG5vbmU7IGN1cnNvcjogZ3JhYjsgfQogIDwvc3R5bGU+CjwvaGVhZD4KPGJvZHkgY2xhc3M9ImJnLXNsYXRlLTEwMCBtaW4taC1zY3JlZW4gdGV4dC1zbGF0ZS04MDAiPgogIDxkaXYgeC1kYXRhPSJwYWNrbGlzdGUoKSIgeC1pbml0PSJpbml0KCkiIHgtY2xvYWs+CgogICAgPGRpdiBjbGFzcz0ibWF4LXcteGwgbXgtYXV0byBweC00IHB5LTYgcGItMzIiPgogICAgICA8IS0tIEtvcGYgLS0+CiAgICAgIDxoZWFkZXIgY2xhc3M9Im1iLTQiPgogICAgICAgIDxkaXYgY2xhc3M9ImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiI+CiAgICAgICAgICA8aDEgY2xhc3M9InRleHQtMnhsIGZvbnQtYm9sZCB0ZXh0LXNsYXRlLTkwMCI+8J+nsyBVcmxhdWJzcGFja2xpc3RlPC9oMT4KICAgICAgICAgIDxidXR0b24gQGNsaWNrPSJsb2FkKCkiIDpjbGFzcz0ibG9hZGluZyAmJiAnYW5pbWF0ZS1zcGluJyIgY2xhc3M9InRleHQtc2xhdGUtNDAwIHRleHQteGwiIHRpdGxlPSJBa3R1YWxpc2llcmVuIj7in7M8L2J1dHRvbj4KICAgICAgICA8L2Rpdj4KICAgICAgICA8cCBjbGFzcz0idGV4dC1zbSB0ZXh0LXNsYXRlLTUwMCBtdC0xIiB4LXRleHQ9InN0YXR1c1RleHQoKSI+PC9wPgogICAgICAgIDxkaXYgY2xhc3M9Im10LTMgaC0yIHctZnVsbCByb3VuZGVkLWZ1bGwgYmctc2xhdGUtMjAwIG92ZXJmbG93LWhpZGRlbiI+CiAgICAgICAgICA8ZGl2IGNsYXNzPSJoLWZ1bGwgYmctZW1lcmFsZC01MDAgdHJhbnNpdGlvbi1hbGwgZHVyYXRpb24tMzAwIiA6c3R5bGU9ImB3aWR0aDogJHtwcm9ncmVzcygpfSVgIj48L2Rpdj4KICAgICAgICA8L2Rpdj4KICAgICAgICA8cCBjbGFzcz0idGV4dC1bMTFweF0gdGV4dC1zbGF0ZS00MDAgbXQtMiI+VGlwcDogYXVmIGRlbiBUZXh0IHRpcHBlbiB6dW0gVW1iZW5lbm5lbiDCtyBhbSDioL8gemllaGVuLCB1bSBpbiBlaW5lIGFuZGVyZSBSdWJyaWsgenUgc2NoaWViZW4uPC9wPgogICAgICA8L2hlYWRlcj4KCiAgICAgIDwhLS0gTGlzdGUgbmFjaCBLYXRlZ29yaWUgLS0+CiAgICAgIDx0ZW1wbGF0ZSB4LWZvcj0iY2F0IGluIGNhdGVnb3JpZXMoKSIgOmtleT0iY2F0Ij4KICAgICAgICA8c2VjdGlvbiBjbGFzcz0ibWItNSI+CiAgICAgICAgICA8aDIgY2xhc3M9InRleHQteHMgZm9udC1zZW1pYm9sZCB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZSB0ZXh0LXNsYXRlLTQwMCBtYi0yIHB4LTEiIHgtdGV4dD0iY2F0Ij48L2gyPgogICAgICAgICAgPGRpdiBjbGFzcz0iY2F0LWxpc3QgYmctd2hpdGUgcm91bmRlZC0yeGwgc2hhZG93LXNtIGRpdmlkZS15IGRpdmlkZS1zbGF0ZS0xMDAgb3ZlcmZsb3ctaGlkZGVuIgogICAgICAgICAgICAgICA6ZGF0YS1jYXRlZ29yeT0iY2F0IiB4LWluaXQ9ImluaXRTb3J0YWJsZSgkZWwpIj4KICAgICAgICAgICAgPHRlbXBsYXRlIHgtZm9yPSJpdGVtIGluIGl0ZW1zSW4oY2F0KSIgOmtleT0iaXRlbS5pZCI+CiAgICAgICAgICAgICAgPGRpdiBjbGFzcz0iZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgcHgtMyBweS0zIGFjdGl2ZTpiZy1zbGF0ZS01MCIgOmRhdGEtaWQ9Iml0ZW0uaWQiPgogICAgICAgICAgICAgICAgPHNwYW4geC1zaG93PSJlZGl0aW5nSWQgIT09IGl0ZW0uaWQiIGNsYXNzPSJkcmFnLWhhbmRsZSBzaHJpbmstMCB0ZXh0LXNsYXRlLTMwMCB0ZXh0LWxnIHNlbGVjdC1ub25lIHB4LTEiPuKgvzwvc3Bhbj4KICAgICAgICAgICAgICAgIDxidXR0b24geC1zaG93PSJlZGl0aW5nSWQgIT09IGl0ZW0uaWQiIEBjbGljaz0idG9nZ2xlKGl0ZW0pIgogICAgICAgICAgICAgICAgICA6Y2xhc3M9Iml0ZW0uY29tcGxldGVkID8gJ2JnLWVtZXJhbGQtNTAwIGJvcmRlci1lbWVyYWxkLTUwMCcgOiAnYm9yZGVyLXNsYXRlLTMwMCciCiAgICAgICAgICAgICAgICAgIGNsYXNzPSJzaHJpbmstMCB3LTYgaC02IHJvdW5kZWQtZnVsbCBib3JkZXItMiBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciB0cmFuc2l0aW9uLWNvbG9ycyI+CiAgICAgICAgICAgICAgICAgIDxzcGFuIHgtc2hvdz0iaXRlbS5jb21wbGV0ZWQiIGNsYXNzPSJ0ZXh0LXdoaXRlIHRleHQtc20iPuKckzwvc3Bhbj4KICAgICAgICAgICAgICAgIDwvYnV0dG9uPgoKICAgICAgICAgICAgICAgIDwhLS0gQW56ZWlnZSAtLT4KICAgICAgICAgICAgICAgIDxzcGFuIHgtc2hvdz0iZWRpdGluZ0lkICE9PSBpdGVtLmlkIgogICAgICAgICAgICAgICAgICBAY2xpY2s9InN0YXJ0RWRpdChpdGVtKSIKICAgICAgICAgICAgICAgICAgY2xhc3M9ImZsZXgtMSB0ZXh0LVsxNXB4XSBjdXJzb3ItdGV4dCIKICAgICAgICAgICAgICAgICAgOmNsYXNzPSJpdGVtLmNvbXBsZXRlZCAmJiAnbGluZS10aHJvdWdoIHRleHQtc2xhdGUtNDAwJyIKICAgICAgICAgICAgICAgICAgeC10ZXh0PSJpdGVtLnRpdGxlIj48L3NwYW4+CiAgICAgICAgICAgICAgICA8YnV0dG9uIHgtc2hvdz0iZWRpdGluZ0lkICE9PSBpdGVtLmlkIiBAY2xpY2s9InJlbW92ZShpdGVtKSIgY2xhc3M9InNocmluay0wIHRleHQtc2xhdGUtMzAwIGhvdmVyOnRleHQtcm9zZS01MDAgdGV4dC1sZyBweC0xIj7DlzwvYnV0dG9uPgoKICAgICAgICAgICAgICAgIDwhLS0gQmVhcmJlaXRlbjogVGV4dCB1bXNjaHJlaWJlbiArIEthdGVnb3JpZSB3ZWNoc2VsbiAtLT4KICAgICAgICAgICAgICAgIDxkaXYgeC1zaG93PSJlZGl0aW5nSWQgPT09IGl0ZW0uaWQiIGNsYXNzPSJmbGV4LTEgZmxleCBmbGV4LWNvbCBnYXAtMSIgQGNsaWNrLnN0b3A+CiAgICAgICAgICAgICAgICAgIDxpbnB1dCB4LW1vZGVsPSJlZGl0VGV4dCIKICAgICAgICAgICAgICAgICAgICBAa2V5ZG93bi5lbnRlcj0ic2F2ZUVkaXQoaXRlbSkiIEBrZXlkb3duLmVzY2FwZT0iY2FuY2VsRWRpdCgpIgogICAgICAgICAgICAgICAgICAgIHgtcmVmPSJlZGl0IgogICAgICAgICAgICAgICAgICAgIGNsYXNzPSJ3LWZ1bGwgdGV4dC1bMTVweF0gYm9yZGVyIGJvcmRlci1lbWVyYWxkLTQwMCByb3VuZGVkIHB4LTIgcHktMSBmb2N1czpvdXRsaW5lLW5vbmUiPgogICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPSJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiI+CiAgICAgICAgICAgICAgICAgICAgPHNlbGVjdCB4LW1vZGVsPSJpdGVtLmNhdGVnb3J5IiBAY2hhbmdlPSJwZXJzaXN0KGl0ZW0pIgogICAgICAgICAgICAgICAgICAgICAgY2xhc3M9ImZsZXgtMSB0ZXh0LXNtIGJvcmRlciBib3JkZXItc2xhdGUtMzAwIHJvdW5kZWQgcHgtMiBweS0xIGJnLXdoaXRlIHRleHQtc2xhdGUtNjAwIj4KICAgICAgICAgICAgICAgICAgICAgIDx0ZW1wbGF0ZSB4LWZvcj0iYyBpbiBfY2F0ZWdvcmllcyIgOmtleT0iYyI+PG9wdGlvbiA6dmFsdWU9ImMiIHgtdGV4dD0iYyI+PC9vcHRpb24+PC90ZW1wbGF0ZT4KICAgICAgICAgICAgICAgICAgICA8L3NlbGVjdD4KICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIEBjbGljaz0ic2F2ZUVkaXQoaXRlbSkiIGNsYXNzPSJzaHJpbmstMCByb3VuZGVkIGJnLWVtZXJhbGQtNjAwIHRleHQtd2hpdGUgdGV4dC1zbSBweC0zIHB5LTEiPkZlcnRpZzwvYnV0dG9uPgogICAgICAgICAgICAgICAgICA8L2Rpdj4KICAgICAgICAgICAgICAgIDwvZGl2PgogICAgICAgICAgICAgIDwvZGl2PgogICAgICAgICAgICA8L3RlbXBsYXRlPgogICAgICAgICAgPC9kaXY+CiAgICAgICAgPC9zZWN0aW9uPgogICAgICA8L3RlbXBsYXRlPgoKICAgICAgPHAgeC1zaG93PSJpdGVtcy5sZW5ndGggPT09IDAgJiYgIWxvYWRpbmciIGNsYXNzPSJ0ZXh0LWNlbnRlciB0ZXh0LXNsYXRlLTQwMCBweS0xMCI+CiAgICAgICAgTm9jaCBuaWNodHMgZHJhdWYg4oCTIGbDvGdlIHVudGVuIGRlbiBlcnN0ZW4gUHVua3QgaGluenUuIPCfkYcKICAgICAgPC9wPgogICAgPC9kaXY+CgogICAgPCEtLSBFaW5nYWJlbGVpc3RlIHVudGVuIC0tPgogICAgPGZvcm0gQHN1Ym1pdC5wcmV2ZW50PSJzdWJtaXRBZGQoKSIKICAgICAgY2xhc3M9ImZpeGVkIGJvdHRvbS0wIGluc2V0LXgtMCBib3JkZXItdCBib3JkZXItc2xhdGUtMjAwIGJnLXdoaXRlLzk1IGJhY2tkcm9wLWJsdXIgcHgtNCBweS0zIj4KICAgICAgPGRpdiBjbGFzcz0ibWF4LXcteGwgbXgtYXV0byBmbGV4IGdhcC0yIj4KICAgICAgICA8c2VsZWN0IHgtbW9kZWw9Im5ld0NhdCIgY2xhc3M9InJvdW5kZWQteGwgYm9yZGVyIGJvcmRlci1zbGF0ZS0zMDAgYmctd2hpdGUgcHgtMiBweS0yIHRleHQtc20gdGV4dC1zbGF0ZS02MDAiPgogICAgICAgICAgPHRlbXBsYXRlIHgtZm9yPSJjIGluIF9jYXRlZ29yaWVzIiA6a2V5PSJjIj48b3B0aW9uIHgtdGV4dD0iYyIgOnZhbHVlPSJjIj48L29wdGlvbj48L3RlbXBsYXRlPgogICAgICAgIDwvc2VsZWN0PgogICAgICAgIDxpbnB1dCB4LW1vZGVsPSJuZXdUaXRsZSIgdHlwZT0idGV4dCIgcGxhY2Vob2xkZXI9IldhcyBub2NoIGVpbnBhY2tlbj8iIGVudGVya2V5aGludD0iZG9uZSIKICAgICAgICAgIGNsYXNzPSJmbGV4LTEgcm91bmRlZC14bCBib3JkZXIgYm9yZGVyLXNsYXRlLTMwMCBweC0zIHB5LTIgdGV4dC1bMTVweF0gZm9jdXM6b3V0bGluZS1ub25lIGZvY3VzOnJpbmctMiBmb2N1czpyaW5nLWVtZXJhbGQtNDAwIj4KICAgICAgICA8YnV0dG9uIHR5cGU9InN1Ym1pdCIgY2xhc3M9InJvdW5kZWQteGwgYmctZW1lcmFsZC02MDAgdGV4dC13aGl0ZSBweC00IHB5LTIgdGV4dC1sZyBmb250LW1lZGl1bSBhY3RpdmU6YmctZW1lcmFsZC03MDAiPis8L2J1dHRvbj4KICAgICAgPC9kaXY+CiAgICA8L2Zvcm0+CgogIDwvZGl2PgoKICA8c2NyaXB0IGlkPSJfX2RhdGEiIHR5cGU9ImFwcGxpY2F0aW9uL2pzb24iPl9fREFUQV9QTEFDRUhPTERFUl9fPC9zY3JpcHQ+CiAgPHNjcmlwdD4KICAgIGNvbnN0IENBVFMgPSBbJ0Rva3VtZW50ZScsICdLbGVpZHVuZycsICdTY2h1aGUnLCAnS2luZGVyJywgJ0t1bHR1cmJldXRlbCcsICdNZWRpa2FtZW50ZScsICdTdXBwbGVtZW50cycsICdUZWNobmlrJywgJ1N0cmFuZCAmIFdhc3NlcicsICdTcGllbGUnLCAnVm9yIGRlciBBYnJlaXNlJywgJ1NvbnN0aWdlcyddOwoKICAgIGZ1bmN0aW9uIHBhY2tsaXN0ZSgpIHsKICAgICAgcmV0dXJuIHsKICAgICAgICBpdGVtczogW10sCiAgICAgICAgbG9hZGluZzogZmFsc2UsCiAgICAgICAgZHJhZ2dpbmc6IGZhbHNlLAogICAgICAgIGVkaXRpbmdJZDogbnVsbCwKICAgICAgICBlZGl0VGV4dDogJycsCiAgICAgICAgbmV3VGl0bGU6ICcnLAogICAgICAgIG5ld0NhdDogJ1NvbnN0aWdlcycsCiAgICAgICAgX2NhdGVnb3JpZXM6IENBVFMsCgogICAgICAgIGluaXQoKSB7CiAgICAgICAgICB0cnkgewogICAgICAgICAgICB0aGlzLml0ZW1zID0gSlNPTi5wYXJzZShhdG9iKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdfX2RhdGEnKS50ZXh0Q29udGVudCkpIHx8IFtdOwogICAgICAgICAgfSBjYXRjaCAoZSkgeyB0aGlzLml0ZW1zID0gW107IH0KICAgICAgICAgIC8vIEFsbGUgfjggU2VrLiBuZXUgbGFkZW4sIGRhbWl0IGlociBiZWlkZSBkaWVzZWxiZW4gSMOka2NoZW4gc2VodAogICAgICAgICAgc2V0SW50ZXJ2YWwoKCkgPT4gdGhpcy5sb2FkKCksIDgwMDApOwogICAgICAgIH0sCiAgICAgICAgY2F0ZWdvcmllcygpIHsKICAgICAgICAgIGNvbnN0IHByZXNlbnQgPSBbLi4ubmV3IFNldCh0aGlzLml0ZW1zLm1hcChpID0+IGkuY2F0ZWdvcnkgfHwgJ1NvbnN0aWdlcycpKV07CiAgICAgICAgICByZXR1cm4gQ0FUUy5maWx0ZXIoYyA9PiBwcmVzZW50LmluY2x1ZGVzKGMpKS5jb25jYXQocHJlc2VudC5maWx0ZXIoYyA9PiAhQ0FUUy5pbmNsdWRlcyhjKSkpOwogICAgICAgIH0sCiAgICAgICAgaXRlbXNJbihjYXQpIHsKICAgICAgICAgIHJldHVybiB0aGlzLml0ZW1zLmZpbHRlcihpID0+IChpLmNhdGVnb3J5IHx8ICdTb25zdGlnZXMnKSA9PT0gY2F0KTsKICAgICAgICB9LAogICAgICAgIHByb2dyZXNzKCkgewogICAgICAgICAgaWYgKCF0aGlzLml0ZW1zLmxlbmd0aCkgcmV0dXJuIDA7CiAgICAgICAgICByZXR1cm4gTWF0aC5yb3VuZCgxMDAgKiB0aGlzLml0ZW1zLmZpbHRlcihpID0+IGkuY29tcGxldGVkKS5sZW5ndGggLyB0aGlzLml0ZW1zLmxlbmd0aCk7CiAgICAgICAgfSwKICAgICAgICBzdGF0dXNUZXh0KCkgewogICAgICAgICAgY29uc3QgZG9uZSA9IHRoaXMuaXRlbXMuZmlsdGVyKGkgPT4gaS5jb21wbGV0ZWQpLmxlbmd0aDsKICAgICAgICAgIHJldHVybiBgJHtkb25lfSB2b24gJHt0aGlzLml0ZW1zLmxlbmd0aH0gZWluZ2VwYWNrdGA7CiAgICAgICAgfSwKCiAgICAgICAgLy8gRHJhZyAmIERyb3Ag4oCTIFZlcnNjaGllYmVuIHp3aXNjaGVuIFJ1YnJpa2VuCiAgICAgICAgaW5pdFNvcnRhYmxlKGVsKSB7CiAgICAgICAgICBpZiAoIXdpbmRvdy5Tb3J0YWJsZSB8fCBlbC5fc29ydGFibGVSZWFkeSkgcmV0dXJuOwogICAgICAgICAgZWwuX3NvcnRhYmxlUmVhZHkgPSB0cnVlOwogICAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7CiAgICAgICAgICBTb3J0YWJsZS5jcmVhdGUoZWwsIHsKICAgICAgICAgICAgZ3JvdXA6ICdwYWNrbGlzdGUnLAogICAgICAgICAgICBoYW5kbGU6ICcuZHJhZy1oYW5kbGUnLAogICAgICAgICAgICBmb3JjZUZhbGxiYWNrOiB0cnVlLAogICAgICAgICAgICBmYWxsYmFja1RvbGVyYW5jZTogNSwKICAgICAgICAgICAgYW5pbWF0aW9uOiAxNTAsCiAgICAgICAgICAgIGdob3N0Q2xhc3M6ICdzb3J0YWJsZS1naG9zdCcsCiAgICAgICAgICAgIGNob3NlbkNsYXNzOiAnc29ydGFibGUtY2hvc2VuJywKICAgICAgICAgICAgb25TdGFydCgpIHsgc2VsZi5kcmFnZ2luZyA9IHRydWU7IH0sCiAgICAgICAgICAgIG9uRW5kKGV2dCkgewogICAgICAgICAgICAgIHNlbGYuZHJhZ2dpbmcgPSBmYWxzZTsKICAgICAgICAgICAgICBjb25zdCBpZCA9IGV2dC5pdGVtLmdldEF0dHJpYnV0ZSgnZGF0YS1pZCcpOwogICAgICAgICAgICAgIGNvbnN0IHRvQ2F0ID0gZXZ0LnRvICYmIGV2dC50by5nZXRBdHRyaWJ1dGUoJ2RhdGEtY2F0ZWdvcnknKTsKICAgICAgICAgICAgICBjb25zdCBmcm9tQ2F0ID0gZXZ0LmZyb20gJiYgZXZ0LmZyb20uZ2V0QXR0cmlidXRlKCdkYXRhLWNhdGVnb3J5Jyk7CiAgICAgICAgICAgICAgaWYgKHRvQ2F0ICYmIGZyb21DYXQgJiYgdG9DYXQgIT09IGZyb21DYXQpIHsKICAgICAgICAgICAgICAgIC8vIEFscGluZSBibGVpYnQgZGllIFF1ZWxsZSBkZXIgV2FocmhlaXQ6IHZvbiBTb3J0YWJsZSBlaW5nZWbDvGd0ZW4gS25vdGVuIGVudGZlcm5lbgogICAgICAgICAgICAgICAgZXZ0Lml0ZW0ucmVtb3ZlKCk7CiAgICAgICAgICAgICAgICBjb25zdCBpdCA9IHNlbGYuaXRlbXMuZmluZCh4ID0+IFN0cmluZyh4LmlkKSA9PT0gU3RyaW5nKGlkKSk7CiAgICAgICAgICAgICAgICBpZiAoaXQpIHsgaXQuY2F0ZWdvcnkgPSB0b0NhdDsgc2VsZi5wZXJzaXN0KGl0KTsgfQogICAgICAgICAgICAgIH0KICAgICAgICAgICAgfQogICAgICAgICAgfSk7CiAgICAgICAgfSwKCiAgICAgICAgYXN5bmMgbG9hZCgpIHsKICAgICAgICAgIGlmICh0aGlzLmVkaXRpbmdJZCAhPT0gbnVsbCB8fCB0aGlzLmRyYWdnaW5nKSByZXR1cm47IC8vIG5pY2h0IG1pdHRlbiBpbSBCZWFyYmVpdGVuL1ppZWhlbiBuZXUgbGFkZW4KICAgICAgICAgIHRoaXMubG9hZGluZyA9IHRydWU7CiAgICAgICAgICB0cnkgewogICAgICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCgnL3dlYmhvb2svcGFja2xpc3RlL2l0ZW1zJywgeyBjYWNoZTogJ25vLXN0b3JlJyB9KTsKICAgICAgICAgICAgaWYgKHJlcy5vaykgdGhpcy5pdGVtcyA9IGF3YWl0IHJlcy5qc29uKCk7CiAgICAgICAgICB9IGNhdGNoIChlKSB7fSBmaW5hbGx5IHsgdGhpcy5sb2FkaW5nID0gZmFsc2U7IH0KICAgICAgICB9LAogICAgICAgIGFzeW5jIHRvZ2dsZShpdGVtKSB7CiAgICAgICAgICBpdGVtLmNvbXBsZXRlZCA9ICFpdGVtLmNvbXBsZXRlZDsKICAgICAgICAgIHRyeSB7CiAgICAgICAgICAgIGF3YWl0IGZldGNoKCcvd2ViaG9vay9wYWNrbGlzdGUvdG9nZ2xlJywgewogICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLCBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSwKICAgICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGlkOiBpdGVtLmlkLCBjb21wbGV0ZWQ6IGl0ZW0uY29tcGxldGVkIH0pCiAgICAgICAgICAgIH0pOwogICAgICAgICAgfSBjYXRjaCAoZSkgeyBpdGVtLmNvbXBsZXRlZCA9ICFpdGVtLmNvbXBsZXRlZDsgfQogICAgICAgIH0sCgogICAgICAgIC8vIEJlYXJiZWl0ZW4gZGVzIFRleHRlcwogICAgICAgIHN0YXJ0RWRpdChpdGVtKSB7CiAgICAgICAgICBpZiAodHlwZW9mIGl0ZW0uaWQgPT09ICdzdHJpbmcnICYmIGl0ZW0uaWQuc3RhcnRzV2l0aCgndG1wLScpKSByZXR1cm47IC8vIGVyc3QgbmFjaCBkZW0gU3BlaWNoZXJuCiAgICAgICAgICB0aGlzLmVkaXRpbmdJZCA9IGl0ZW0uaWQ7CiAgICAgICAgICB0aGlzLmVkaXRUZXh0ID0gaXRlbS50aXRsZTsKICAgICAgICAgIHRoaXMuJG5leHRUaWNrKCgpID0+IHsgaWYgKHRoaXMuJHJlZnMuZWRpdCkgeyB0aGlzLiRyZWZzLmVkaXQuZm9jdXMoKTsgdGhpcy4kcmVmcy5lZGl0LnNlbGVjdCgpOyB9IH0pOwogICAgICAgIH0sCiAgICAgICAgY2FuY2VsRWRpdCgpIHsgdGhpcy5lZGl0aW5nSWQgPSBudWxsOyB0aGlzLmVkaXRUZXh0ID0gJyc7IH0sCiAgICAgICAgYXN5bmMgc2F2ZUVkaXQoaXRlbSkgewogICAgICAgICAgaWYgKHRoaXMuZWRpdGluZ0lkICE9PSBpdGVtLmlkKSByZXR1cm47CiAgICAgICAgICBjb25zdCB0ID0gKHRoaXMuZWRpdFRleHQgfHwgJycpLnRyaW0oKTsKICAgICAgICAgIHRoaXMuZWRpdGluZ0lkID0gbnVsbDsKICAgICAgICAgIGlmICh0ICYmIHQgIT09IGl0ZW0udGl0bGUpIHsKICAgICAgICAgICAgaXRlbS50aXRsZSA9IHQ7CiAgICAgICAgICAgIHRoaXMucGVyc2lzdChpdGVtKTsKICAgICAgICAgIH0KICAgICAgICB9LAoKICAgICAgICAvLyDDhG5kZXJ1bmcgKFRpdGVsIHVuZC9vZGVyIEthdGVnb3JpZSkgc3BlaWNoZXJuCiAgICAgICAgYXN5bmMgcGVyc2lzdChpdGVtKSB7CiAgICAgICAgICB0cnkgewogICAgICAgICAgICBhd2FpdCBmZXRjaCgnL3dlYmhvb2svcGFja2xpc3RlL3VwZGF0ZScsIHsKICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJywgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sCiAgICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBpZDogaXRlbS5pZCwgdGl0bGU6IGl0ZW0udGl0bGUsIGNhdGVnb3J5OiBpdGVtLmNhdGVnb3J5IH0pCiAgICAgICAgICAgIH0pOwogICAgICAgICAgfSBjYXRjaCAoZSkge30KICAgICAgICB9LAoKICAgICAgICBhc3luYyBzdWJtaXRBZGQoKSB7CiAgICAgICAgICBjb25zdCB0aXRsZSA9ICh0aGlzLm5ld1RpdGxlIHx8ICcnKS50cmltKCk7CiAgICAgICAgICBpZiAoIXRpdGxlKSByZXR1cm47CiAgICAgICAgICBjb25zdCBjYXRlZ29yeSA9IHRoaXMubmV3Q2F0IHx8ICdTb25zdGlnZXMnOwogICAgICAgICAgdGhpcy5uZXdUaXRsZSA9ICcnOwogICAgICAgICAgY29uc3Qgb3B0aW1pc3RpYyA9IHsgaWQ6ICd0bXAtJyArIERhdGUubm93KCksIHRpdGxlOiB0aXRsZSwgY2F0ZWdvcnk6IGNhdGVnb3J5LCBjb21wbGV0ZWQ6IGZhbHNlIH07CiAgICAgICAgICB0aGlzLml0ZW1zLnB1c2gob3B0aW1pc3RpYyk7CiAgICAgICAgICB0cnkgewogICAgICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCgnL3dlYmhvb2svcGFja2xpc3RlL2FkZCcsIHsKICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJywgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sCiAgICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyB0aXRsZTogdGl0bGUsIGNhdGVnb3J5OiBjYXRlZ29yeSB9KQogICAgICAgICAgICB9KTsKICAgICAgICAgICAgaWYgKHJlcy5vaykgewogICAgICAgICAgICAgIGNvbnN0IGNyZWF0ZWQgPSBhd2FpdCByZXMuanNvbigpOwogICAgICAgICAgICAgIGNvbnN0IHJvdyA9IEFycmF5LmlzQXJyYXkoY3JlYXRlZCkgPyBjcmVhdGVkWzBdIDogY3JlYXRlZDsKICAgICAgICAgICAgICBpZiAocm93ICYmIHJvdy5pZCkgT2JqZWN0LmFzc2lnbihvcHRpbWlzdGljLCByb3cpOwogICAgICAgICAgICB9CiAgICAgICAgICB9IGNhdGNoIChlKSB7fQogICAgICAgIH0sCiAgICAgICAgYXN5bmMgcmVtb3ZlKGl0ZW0pIHsKICAgICAgICAgIHRoaXMuaXRlbXMgPSB0aGlzLml0ZW1zLmZpbHRlcihpID0+IGkuaWQgIT09IGl0ZW0uaWQpOwogICAgICAgICAgdHJ5IHsKICAgICAgICAgICAgYXdhaXQgZmV0Y2goJy93ZWJob29rL3BhY2tsaXN0ZS9kZWxldGUnLCB7CiAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LAogICAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgaWQ6IGl0ZW0uaWQgfSkKICAgICAgICAgICAgfSk7CiAgICAgICAgICB9IGNhdGNoIChlKSB7fQogICAgICAgIH0KICAgICAgfTsKICAgIH0KICA8L3NjcmlwdD4KPC9ib2R5Pgo8L2h0bWw+Cg==';
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
