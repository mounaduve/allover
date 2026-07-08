import { workflow, node, trigger, expr } from '@n8n/workflow-sdk';

const HTML_B64 = 'PCFET0NUWVBFIGh0bWw+CjxodG1sIGxhbmc9ImRlIj4KPGhlYWQ+CiAgPG1ldGEgY2hhcnNldD0iVVRGLTgiPgogIDxtZXRhIG5hbWU9InZpZXdwb3J0IiBjb250ZW50PSJ3aWR0aD1kZXZpY2Utd2lkdGgsIGluaXRpYWwtc2NhbGU9MS4wIj4KICA8dGl0bGU+VXJsYXVic3BhY2tsaXN0ZTwvdGl0bGU+CiAgPHNjcmlwdCBzcmM9Imh0dHBzOi8vY2RuLnRhaWx3aW5kY3NzLmNvbSI+PC9zY3JpcHQ+CiAgPHNjcmlwdCBkZWZlciBzcmM9Imh0dHBzOi8vY2RuLmpzZGVsaXZyLm5ldC9ucG0vYWxwaW5lanNAMy9kaXN0L2Nkbi5taW4uanMiPjwvc2NyaXB0PgogIDxzY3JpcHQgc3JjPSJodHRwczovL2Nkbi5qc2RlbGl2ci5uZXQvbnBtL3NvcnRhYmxlanNAMS4xNS42L1NvcnRhYmxlLm1pbi5qcyI+PC9zY3JpcHQ+CiAgPHN0eWxlPgogICAgW3gtY2xvYWtdIHsgZGlzcGxheTogbm9uZSAhaW1wb3J0YW50OyB9CiAgICBib2R5IHsgLXdlYmtpdC10YXAtaGlnaGxpZ2h0LWNvbG9yOiB0cmFuc3BhcmVudDsgfQogICAgLnNvcnRhYmxlLWdob3N0IHsgb3BhY2l0eTogLjQ7IH0KICAgIC5zb3J0YWJsZS1jaG9zZW4geyBiYWNrZ3JvdW5kOiAjZjFmNWY5OyB9CiAgICAuZHJhZy1oYW5kbGUgeyB0b3VjaC1hY3Rpb246IG5vbmU7IGN1cnNvcjogZ3JhYjsgfQogIDwvc3R5bGU+CjwvaGVhZD4KPGJvZHkgY2xhc3M9ImJnLXNsYXRlLTEwMCBtaW4taC1zY3JlZW4gdGV4dC1zbGF0ZS04MDAiPgogIDxkaXYgeC1kYXRhPSJwYWNrbGlzdGUoKSIgeC1pbml0PSJpbml0KCkiIHgtY2xvYWs+CgogICAgPGRpdiBjbGFzcz0ibWF4LXcteGwgbXgtYXV0byBweC00IHB5LTYgcGItMzIiPgogICAgICA8IS0tIEtvcGYgLS0+CiAgICAgIDxoZWFkZXIgY2xhc3M9Im1iLTQiPgogICAgICAgIDxkaXYgY2xhc3M9ImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiI+CiAgICAgICAgICA8aDEgY2xhc3M9InRleHQtMnhsIGZvbnQtYm9sZCB0ZXh0LXNsYXRlLTkwMCI+8J+nsyBVcmxhdWJzcGFja2xpc3RlPC9oMT4KICAgICAgICAgIDxidXR0b24gQGNsaWNrPSJsb2FkKCkiIDpjbGFzcz0ibG9hZGluZyAmJiAnYW5pbWF0ZS1zcGluJyIgY2xhc3M9InRleHQtc2xhdGUtNDAwIHRleHQteGwiIHRpdGxlPSJBa3R1YWxpc2llcmVuIj7in7M8L2J1dHRvbj4KICAgICAgICA8L2Rpdj4KICAgICAgICA8cCBjbGFzcz0idGV4dC1zbSB0ZXh0LXNsYXRlLTUwMCBtdC0xIiB4LXRleHQ9InN0YXR1c1RleHQoKSI+PC9wPgogICAgICAgIDxkaXYgY2xhc3M9Im10LTMgaC0yIHctZnVsbCByb3VuZGVkLWZ1bGwgYmctc2xhdGUtMjAwIG92ZXJmbG93LWhpZGRlbiI+CiAgICAgICAgICA8ZGl2IGNsYXNzPSJoLWZ1bGwgYmctZW1lcmFsZC01MDAgdHJhbnNpdGlvbi1hbGwgZHVyYXRpb24tMzAwIiA6c3R5bGU9ImB3aWR0aDogJHtwcm9ncmVzcygpfSVgIj48L2Rpdj4KICAgICAgICA8L2Rpdj4KICAgICAgICA8cCBjbGFzcz0idGV4dC1bMTFweF0gdGV4dC1zbGF0ZS00MDAgbXQtMiI+VGlwcDogYXVmIGRlbiBUZXh0IHRpcHBlbiB6dW0gVW1iZW5lbm5lbiDCtyBhbSDioL8gemllaGVuLCB1bSBpbiBlaW5lIGFuZGVyZSBSdWJyaWsgenUgc2NoaWViZW4uPC9wPgogICAgICA8L2hlYWRlcj4KCiAgICAgIDwhLS0gTGlzdGUgbmFjaCBLYXRlZ29yaWUgLS0+CiAgICAgIDx0ZW1wbGF0ZSB4LWZvcj0iY2F0IGluIGNhdGVnb3JpZXMoKSIgOmtleT0iY2F0Ij4KICAgICAgICA8c2VjdGlvbiBjbGFzcz0ibWItNSI+CiAgICAgICAgICA8aDIgY2xhc3M9InRleHQteHMgZm9udC1zZW1pYm9sZCB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZSB0ZXh0LXNsYXRlLTQwMCBtYi0yIHB4LTEiIHgtdGV4dD0iY2F0Ij48L2gyPgogICAgICAgICAgPGRpdiBjbGFzcz0iY2F0LWxpc3QgYmctd2hpdGUgcm91bmRlZC0yeGwgc2hhZG93LXNtIGRpdmlkZS15IGRpdmlkZS1zbGF0ZS0xMDAgb3ZlcmZsb3ctaGlkZGVuIgogICAgICAgICAgICAgICA6ZGF0YS1jYXRlZ29yeT0iY2F0IiB4LWluaXQ9ImluaXRTb3J0YWJsZSgkZWwpIj4KICAgICAgICAgICAgPHRlbXBsYXRlIHgtZm9yPSJpdGVtIGluIGl0ZW1zSW4oY2F0KSIgOmtleT0iaXRlbS5pZCI+CiAgICAgICAgICAgICAgPGRpdiBjbGFzcz0iZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgcHgtMyBweS0zIGFjdGl2ZTpiZy1zbGF0ZS01MCIgOmRhdGEtaWQ9Iml0ZW0uaWQiPgogICAgICAgICAgICAgICAgPHNwYW4geC1zaG93PSJlZGl0aW5nSWQgIT09IGl0ZW0uaWQiIGNsYXNzPSJkcmFnLWhhbmRsZSBzaHJpbmstMCB0ZXh0LXNsYXRlLTMwMCB0ZXh0LWxnIHNlbGVjdC1ub25lIHB4LTEiPuKgvzwvc3Bhbj4KICAgICAgICAgICAgICAgIDxidXR0b24geC1zaG93PSJlZGl0aW5nSWQgIT09IGl0ZW0uaWQiIEBjbGljaz0idG9nZ2xlKGl0ZW0pIgogICAgICAgICAgICAgICAgICA6Y2xhc3M9Iml0ZW0uY29tcGxldGVkID8gJ2JnLWVtZXJhbGQtNTAwIGJvcmRlci1lbWVyYWxkLTUwMCcgOiAnYm9yZGVyLXNsYXRlLTMwMCciCiAgICAgICAgICAgICAgICAgIGNsYXNzPSJzaHJpbmstMCB3LTYgaC02IHJvdW5kZWQtZnVsbCBib3JkZXItMiBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciB0cmFuc2l0aW9uLWNvbG9ycyI+CiAgICAgICAgICAgICAgICAgIDxzcGFuIHgtc2hvdz0iaXRlbS5jb21wbGV0ZWQiIGNsYXNzPSJ0ZXh0LXdoaXRlIHRleHQtc20iPuKckzwvc3Bhbj4KICAgICAgICAgICAgICAgIDwvYnV0dG9uPgoKICAgICAgICAgICAgICAgIDwhLS0gQW56ZWlnZSAtLT4KICAgICAgICAgICAgICAgIDxzcGFuIHgtc2hvdz0iZWRpdGluZ0lkICE9PSBpdGVtLmlkIgogICAgICAgICAgICAgICAgICBAY2xpY2s9InN0YXJ0RWRpdChpdGVtKSIKICAgICAgICAgICAgICAgICAgY2xhc3M9ImZsZXgtMSB0ZXh0LVsxNXB4XSBjdXJzb3ItdGV4dCIKICAgICAgICAgICAgICAgICAgOmNsYXNzPSJpdGVtLmNvbXBsZXRlZCAmJiAnbGluZS10aHJvdWdoIHRleHQtc2xhdGUtNDAwJyIKICAgICAgICAgICAgICAgICAgeC10ZXh0PSJpdGVtLnRpdGxlIj48L3NwYW4+CiAgICAgICAgICAgICAgICA8YnV0dG9uIHgtc2hvdz0iZWRpdGluZ0lkICE9PSBpdGVtLmlkIiBAY2xpY2s9InJlbW92ZShpdGVtKSIgY2xhc3M9InNocmluay0wIHRleHQtc2xhdGUtMzAwIGhvdmVyOnRleHQtcm9zZS01MDAgdGV4dC1sZyBweC0xIj7DlzwvYnV0dG9uPgoKICAgICAgICAgICAgICAgIDwhLS0gQmVhcmJlaXRlbjogVGV4dCB1bXNjaHJlaWJlbiArIEthdGVnb3JpZSB3ZWNoc2VsbiAtLT4KICAgICAgICAgICAgICAgIDxkaXYgeC1zaG93PSJlZGl0aW5nSWQgPT09IGl0ZW0uaWQiIGNsYXNzPSJmbGV4LTEgZmxleCBmbGV4LWNvbCBnYXAtMSIgQGNsaWNrLnN0b3A+CiAgICAgICAgICAgICAgICAgIDxpbnB1dCB4LW1vZGVsPSJlZGl0VGV4dCIKICAgICAgICAgICAgICAgICAgICBAa2V5ZG93bi5lbnRlcj0ic2F2ZUVkaXQoaXRlbSkiIEBrZXlkb3duLmVzY2FwZT0iY2FuY2VsRWRpdCgpIgogICAgICAgICAgICAgICAgICAgIHgtcmVmPSJlZGl0IgogICAgICAgICAgICAgICAgICAgIGNsYXNzPSJ3LWZ1bGwgdGV4dC1bMTVweF0gYm9yZGVyIGJvcmRlci1lbWVyYWxkLTQwMCByb3VuZGVkIHB4LTIgcHktMSBmb2N1czpvdXRsaW5lLW5vbmUiPgogICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPSJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiI+CiAgICAgICAgICAgICAgICAgICAgPHNlbGVjdCB4LW1vZGVsPSJpdGVtLmNhdGVnb3J5IiBAY2hhbmdlPSJwZXJzaXN0KGl0ZW0pIgogICAgICAgICAgICAgICAgICAgICAgY2xhc3M9ImZsZXgtMSB0ZXh0LXNtIGJvcmRlciBib3JkZXItc2xhdGUtMzAwIHJvdW5kZWQgcHgtMiBweS0xIGJnLXdoaXRlIHRleHQtc2xhdGUtNjAwIj4KICAgICAgICAgICAgICAgICAgICAgIDx0ZW1wbGF0ZSB4LWZvcj0iYyBpbiBfY2F0ZWdvcmllcyIgOmtleT0iYyI+PG9wdGlvbiA6dmFsdWU9ImMiIHgtdGV4dD0iYyI+PC9vcHRpb24+PC90ZW1wbGF0ZT4KICAgICAgICAgICAgICAgICAgICA8L3NlbGVjdD4KICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIEBjbGljaz0ic2F2ZUVkaXQoaXRlbSkiIGNsYXNzPSJzaHJpbmstMCByb3VuZGVkIGJnLWVtZXJhbGQtNjAwIHRleHQtd2hpdGUgdGV4dC1zbSBweC0zIHB5LTEiPkZlcnRpZzwvYnV0dG9uPgogICAgICAgICAgICAgICAgICA8L2Rpdj4KICAgICAgICAgICAgICAgIDwvZGl2PgogICAgICAgICAgICAgIDwvZGl2PgogICAgICAgICAgICA8L3RlbXBsYXRlPgogICAgICAgICAgPC9kaXY+CiAgICAgICAgPC9zZWN0aW9uPgogICAgICA8L3RlbXBsYXRlPgoKICAgICAgPHAgeC1zaG93PSJpdGVtcy5sZW5ndGggPT09IDAgJiYgIWxvYWRpbmciIGNsYXNzPSJ0ZXh0LWNlbnRlciB0ZXh0LXNsYXRlLTQwMCBweS0xMCI+CiAgICAgICAgTm9jaCBuaWNodHMgZHJhdWYg4oCTIGbDvGdlIHVudGVuIGRlbiBlcnN0ZW4gUHVua3QgaGluenUuIPCfkYcKICAgICAgPC9wPgogICAgPC9kaXY+CgogICAgPCEtLSBFaW5nYWJlbGVpc3RlIHVudGVuIC0tPgogICAgPGZvcm0gQHN1Ym1pdC5wcmV2ZW50PSJzdWJtaXRBZGQoKSIKICAgICAgY2xhc3M9ImZpeGVkIGJvdHRvbS0wIGluc2V0LXgtMCBib3JkZXItdCBib3JkZXItc2xhdGUtMjAwIGJnLXdoaXRlLzk1IGJhY2tkcm9wLWJsdXIgcHgtNCBweS0zIj4KICAgICAgPGRpdiBjbGFzcz0ibWF4LXcteGwgbXgtYXV0byBmbGV4IGdhcC0yIj4KICAgICAgICA8c2VsZWN0IHgtbW9kZWw9Im5ld0NhdCIgY2xhc3M9InJvdW5kZWQteGwgYm9yZGVyIGJvcmRlci1zbGF0ZS0zMDAgYmctd2hpdGUgcHgtMiBweS0yIHRleHQtc20gdGV4dC1zbGF0ZS02MDAiPgogICAgICAgICAgPHRlbXBsYXRlIHgtZm9yPSJjIGluIF9jYXRlZ29yaWVzIiA6a2V5PSJjIj48b3B0aW9uIHgtdGV4dD0iYyIgOnZhbHVlPSJjIj48L29wdGlvbj48L3RlbXBsYXRlPgogICAgICAgIDwvc2VsZWN0PgogICAgICAgIDxpbnB1dCB4LW1vZGVsPSJuZXdUaXRsZSIgdHlwZT0idGV4dCIgcGxhY2Vob2xkZXI9IldhcyBub2NoIGVpbnBhY2tlbj8iIGVudGVya2V5aGludD0iZG9uZSIKICAgICAgICAgIGNsYXNzPSJmbGV4LTEgcm91bmRlZC14bCBib3JkZXIgYm9yZGVyLXNsYXRlLTMwMCBweC0zIHB5LTIgdGV4dC1bMTVweF0gZm9jdXM6b3V0bGluZS1ub25lIGZvY3VzOnJpbmctMiBmb2N1czpyaW5nLWVtZXJhbGQtNDAwIj4KICAgICAgICA8YnV0dG9uIHR5cGU9InN1Ym1pdCIgY2xhc3M9InJvdW5kZWQteGwgYmctZW1lcmFsZC02MDAgdGV4dC13aGl0ZSBweC00IHB5LTIgdGV4dC1sZyBmb250LW1lZGl1bSBhY3RpdmU6YmctZW1lcmFsZC03MDAiPis8L2J1dHRvbj4KICAgICAgPC9kaXY+CiAgICA8L2Zvcm0+CgogIDwvZGl2PgoKICA8c2NyaXB0IGlkPSJfX2RhdGEiIHR5cGU9ImFwcGxpY2F0aW9uL2pzb24iPl9fREFUQV9QTEFDRUhPTERFUl9fPC9zY3JpcHQ+CiAgPHNjcmlwdD4KICAgIGNvbnN0IENBVFMgPSBbJ0Rva3VtZW50ZScsICdLbGVpZHVuZycsICdTY2h1aGUnLCAnUmFuamEnLCAnVGFyZWsnLCAnT2xsaScsICdLdWx0dXJiZXV0ZWwnLCAnTWVkaWthbWVudGUnLCAnU3VwcGxlbWVudHMnLCAnVGVjaG5paycsICdTdHJhbmQgJiBXYXNzZXInLCAnU3BpZWxlJywgJ1ZvciBkZXIgQWJyZWlzZScsICdTb25zdGlnZXMnXTsKCiAgICBmdW5jdGlvbiBwYWNrbGlzdGUoKSB7CiAgICAgIHJldHVybiB7CiAgICAgICAgaXRlbXM6IFtdLAogICAgICAgIGxvYWRpbmc6IGZhbHNlLAogICAgICAgIGRyYWdnaW5nOiBmYWxzZSwKICAgICAgICBlZGl0aW5nSWQ6IG51bGwsCiAgICAgICAgZWRpdFRleHQ6ICcnLAogICAgICAgIG5ld1RpdGxlOiAnJywKICAgICAgICBuZXdDYXQ6ICdTb25zdGlnZXMnLAogICAgICAgIF9jYXRlZ29yaWVzOiBDQVRTLAoKICAgICAgICBpbml0KCkgewogICAgICAgICAgdHJ5IHsKICAgICAgICAgICAgdGhpcy5pdGVtcyA9IEpTT04ucGFyc2UoYXRvYihkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnX19kYXRhJykudGV4dENvbnRlbnQpKSB8fCBbXTsKICAgICAgICAgIH0gY2F0Y2ggKGUpIHsgdGhpcy5pdGVtcyA9IFtdOyB9CiAgICAgICAgICAvLyBBbGxlIH44IFNlay4gbmV1IGxhZGVuLCBkYW1pdCBpaHIgYmVpZGUgZGllc2VsYmVuIEjDpGtjaGVuIHNlaHQKICAgICAgICAgIHNldEludGVydmFsKCgpID0+IHRoaXMubG9hZCgpLCA4MDAwKTsKICAgICAgICB9LAogICAgICAgIGNhdGVnb3JpZXMoKSB7CiAgICAgICAgICBjb25zdCBwcmVzZW50ID0gWy4uLm5ldyBTZXQodGhpcy5pdGVtcy5tYXAoaSA9PiBpLmNhdGVnb3J5IHx8ICdTb25zdGlnZXMnKSldOwogICAgICAgICAgcmV0dXJuIENBVFMuZmlsdGVyKGMgPT4gcHJlc2VudC5pbmNsdWRlcyhjKSkuY29uY2F0KHByZXNlbnQuZmlsdGVyKGMgPT4gIUNBVFMuaW5jbHVkZXMoYykpKTsKICAgICAgICB9LAogICAgICAgIGl0ZW1zSW4oY2F0KSB7CiAgICAgICAgICByZXR1cm4gdGhpcy5pdGVtcy5maWx0ZXIoaSA9PiAoaS5jYXRlZ29yeSB8fCAnU29uc3RpZ2VzJykgPT09IGNhdCk7CiAgICAgICAgfSwKICAgICAgICBwcm9ncmVzcygpIHsKICAgICAgICAgIGlmICghdGhpcy5pdGVtcy5sZW5ndGgpIHJldHVybiAwOwogICAgICAgICAgcmV0dXJuIE1hdGgucm91bmQoMTAwICogdGhpcy5pdGVtcy5maWx0ZXIoaSA9PiBpLmNvbXBsZXRlZCkubGVuZ3RoIC8gdGhpcy5pdGVtcy5sZW5ndGgpOwogICAgICAgIH0sCiAgICAgICAgc3RhdHVzVGV4dCgpIHsKICAgICAgICAgIGNvbnN0IGRvbmUgPSB0aGlzLml0ZW1zLmZpbHRlcihpID0+IGkuY29tcGxldGVkKS5sZW5ndGg7CiAgICAgICAgICByZXR1cm4gYCR7ZG9uZX0gdm9uICR7dGhpcy5pdGVtcy5sZW5ndGh9IGVpbmdlcGFja3RgOwogICAgICAgIH0sCgogICAgICAgIC8vIERyYWcgJiBEcm9wIOKAkyBWZXJzY2hpZWJlbiB6d2lzY2hlbiBSdWJyaWtlbgogICAgICAgIGluaXRTb3J0YWJsZShlbCkgewogICAgICAgICAgaWYgKCF3aW5kb3cuU29ydGFibGUgfHwgZWwuX3NvcnRhYmxlUmVhZHkpIHJldHVybjsKICAgICAgICAgIGVsLl9zb3J0YWJsZVJlYWR5ID0gdHJ1ZTsKICAgICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzOwogICAgICAgICAgU29ydGFibGUuY3JlYXRlKGVsLCB7CiAgICAgICAgICAgIGdyb3VwOiAncGFja2xpc3RlJywKICAgICAgICAgICAgaGFuZGxlOiAnLmRyYWctaGFuZGxlJywKICAgICAgICAgICAgZm9yY2VGYWxsYmFjazogdHJ1ZSwKICAgICAgICAgICAgZmFsbGJhY2tUb2xlcmFuY2U6IDUsCiAgICAgICAgICAgIGFuaW1hdGlvbjogMTUwLAogICAgICAgICAgICBnaG9zdENsYXNzOiAnc29ydGFibGUtZ2hvc3QnLAogICAgICAgICAgICBjaG9zZW5DbGFzczogJ3NvcnRhYmxlLWNob3NlbicsCiAgICAgICAgICAgIG9uU3RhcnQoKSB7IHNlbGYuZHJhZ2dpbmcgPSB0cnVlOyB9LAogICAgICAgICAgICBvbkVuZChldnQpIHsKICAgICAgICAgICAgICBzZWxmLmRyYWdnaW5nID0gZmFsc2U7CiAgICAgICAgICAgICAgY29uc3QgaWQgPSBldnQuaXRlbS5nZXRBdHRyaWJ1dGUoJ2RhdGEtaWQnKTsKICAgICAgICAgICAgICBjb25zdCB0b0NhdCA9IGV2dC50byAmJiBldnQudG8uZ2V0QXR0cmlidXRlKCdkYXRhLWNhdGVnb3J5Jyk7CiAgICAgICAgICAgICAgY29uc3QgZnJvbUNhdCA9IGV2dC5mcm9tICYmIGV2dC5mcm9tLmdldEF0dHJpYnV0ZSgnZGF0YS1jYXRlZ29yeScpOwogICAgICAgICAgICAgIGlmICh0b0NhdCAmJiBmcm9tQ2F0ICYmIHRvQ2F0ICE9PSBmcm9tQ2F0KSB7CiAgICAgICAgICAgICAgICAvLyBBbHBpbmUgYmxlaWJ0IGRpZSBRdWVsbGUgZGVyIFdhaHJoZWl0OiB2b24gU29ydGFibGUgZWluZ2Vmw7xndGVuIEtub3RlbiBlbnRmZXJuZW4KICAgICAgICAgICAgICAgIGV2dC5pdGVtLnJlbW92ZSgpOwogICAgICAgICAgICAgICAgY29uc3QgaXQgPSBzZWxmLml0ZW1zLmZpbmQoeCA9PiBTdHJpbmcoeC5pZCkgPT09IFN0cmluZyhpZCkpOwogICAgICAgICAgICAgICAgaWYgKGl0KSB7IGl0LmNhdGVnb3J5ID0gdG9DYXQ7IHNlbGYucGVyc2lzdChpdCk7IH0KICAgICAgICAgICAgICB9CiAgICAgICAgICAgIH0KICAgICAgICAgIH0pOwogICAgICAgIH0sCgogICAgICAgIGFzeW5jIGxvYWQoKSB7CiAgICAgICAgICBpZiAodGhpcy5lZGl0aW5nSWQgIT09IG51bGwgfHwgdGhpcy5kcmFnZ2luZykgcmV0dXJuOyAvLyBuaWNodCBtaXR0ZW4gaW0gQmVhcmJlaXRlbi9aaWVoZW4gbmV1IGxhZGVuCiAgICAgICAgICB0aGlzLmxvYWRpbmcgPSB0cnVlOwogICAgICAgICAgdHJ5IHsKICAgICAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJy93ZWJob29rL3BhY2tsaXN0ZS9pdGVtcycsIHsgY2FjaGU6ICduby1zdG9yZScgfSk7CiAgICAgICAgICAgIGlmIChyZXMub2spIHRoaXMuaXRlbXMgPSBhd2FpdCByZXMuanNvbigpOwogICAgICAgICAgfSBjYXRjaCAoZSkge30gZmluYWxseSB7IHRoaXMubG9hZGluZyA9IGZhbHNlOyB9CiAgICAgICAgfSwKICAgICAgICBhc3luYyB0b2dnbGUoaXRlbSkgewogICAgICAgICAgaXRlbS5jb21wbGV0ZWQgPSAhaXRlbS5jb21wbGV0ZWQ7CiAgICAgICAgICB0cnkgewogICAgICAgICAgICBhd2FpdCBmZXRjaCgnL3dlYmhvb2svcGFja2xpc3RlL3RvZ2dsZScsIHsKICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJywgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sCiAgICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBpZDogaXRlbS5pZCwgY29tcGxldGVkOiBpdGVtLmNvbXBsZXRlZCB9KQogICAgICAgICAgICB9KTsKICAgICAgICAgIH0gY2F0Y2ggKGUpIHsgaXRlbS5jb21wbGV0ZWQgPSAhaXRlbS5jb21wbGV0ZWQ7IH0KICAgICAgICB9LAoKICAgICAgICAvLyBCZWFyYmVpdGVuIGRlcyBUZXh0ZXMKICAgICAgICBzdGFydEVkaXQoaXRlbSkgewogICAgICAgICAgaWYgKHR5cGVvZiBpdGVtLmlkID09PSAnc3RyaW5nJyAmJiBpdGVtLmlkLnN0YXJ0c1dpdGgoJ3RtcC0nKSkgcmV0dXJuOyAvLyBlcnN0IG5hY2ggZGVtIFNwZWljaGVybgogICAgICAgICAgdGhpcy5lZGl0aW5nSWQgPSBpdGVtLmlkOwogICAgICAgICAgdGhpcy5lZGl0VGV4dCA9IGl0ZW0udGl0bGU7CiAgICAgICAgICB0aGlzLiRuZXh0VGljaygoKSA9PiB7IGlmICh0aGlzLiRyZWZzLmVkaXQpIHsgdGhpcy4kcmVmcy5lZGl0LmZvY3VzKCk7IHRoaXMuJHJlZnMuZWRpdC5zZWxlY3QoKTsgfSB9KTsKICAgICAgICB9LAogICAgICAgIGNhbmNlbEVkaXQoKSB7IHRoaXMuZWRpdGluZ0lkID0gbnVsbDsgdGhpcy5lZGl0VGV4dCA9ICcnOyB9LAogICAgICAgIGFzeW5jIHNhdmVFZGl0KGl0ZW0pIHsKICAgICAgICAgIGlmICh0aGlzLmVkaXRpbmdJZCAhPT0gaXRlbS5pZCkgcmV0dXJuOwogICAgICAgICAgY29uc3QgdCA9ICh0aGlzLmVkaXRUZXh0IHx8ICcnKS50cmltKCk7CiAgICAgICAgICB0aGlzLmVkaXRpbmdJZCA9IG51bGw7CiAgICAgICAgICBpZiAodCAmJiB0ICE9PSBpdGVtLnRpdGxlKSB7CiAgICAgICAgICAgIGl0ZW0udGl0bGUgPSB0OwogICAgICAgICAgICB0aGlzLnBlcnNpc3QoaXRlbSk7CiAgICAgICAgICB9CiAgICAgICAgfSwKCiAgICAgICAgLy8gw4RuZGVydW5nIChUaXRlbCB1bmQvb2RlciBLYXRlZ29yaWUpIHNwZWljaGVybgogICAgICAgIGFzeW5jIHBlcnNpc3QoaXRlbSkgewogICAgICAgICAgdHJ5IHsKICAgICAgICAgICAgYXdhaXQgZmV0Y2goJy93ZWJob29rL3BhY2tsaXN0ZS91cGRhdGUnLCB7CiAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LAogICAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgaWQ6IGl0ZW0uaWQsIHRpdGxlOiBpdGVtLnRpdGxlLCBjYXRlZ29yeTogaXRlbS5jYXRlZ29yeSB9KQogICAgICAgICAgICB9KTsKICAgICAgICAgIH0gY2F0Y2ggKGUpIHt9CiAgICAgICAgfSwKCiAgICAgICAgYXN5bmMgc3VibWl0QWRkKCkgewogICAgICAgICAgY29uc3QgdGl0bGUgPSAodGhpcy5uZXdUaXRsZSB8fCAnJykudHJpbSgpOwogICAgICAgICAgaWYgKCF0aXRsZSkgcmV0dXJuOwogICAgICAgICAgY29uc3QgY2F0ZWdvcnkgPSB0aGlzLm5ld0NhdCB8fCAnU29uc3RpZ2VzJzsKICAgICAgICAgIHRoaXMubmV3VGl0bGUgPSAnJzsKICAgICAgICAgIGNvbnN0IG9wdGltaXN0aWMgPSB7IGlkOiAndG1wLScgKyBEYXRlLm5vdygpLCB0aXRsZTogdGl0bGUsIGNhdGVnb3J5OiBjYXRlZ29yeSwgY29tcGxldGVkOiBmYWxzZSB9OwogICAgICAgICAgdGhpcy5pdGVtcy5wdXNoKG9wdGltaXN0aWMpOwogICAgICAgICAgdHJ5IHsKICAgICAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJy93ZWJob29rL3BhY2tsaXN0ZS9hZGQnLCB7CiAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LAogICAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgdGl0bGU6IHRpdGxlLCBjYXRlZ29yeTogY2F0ZWdvcnkgfSkKICAgICAgICAgICAgfSk7CiAgICAgICAgICAgIGlmIChyZXMub2spIHsKICAgICAgICAgICAgICBjb25zdCBjcmVhdGVkID0gYXdhaXQgcmVzLmpzb24oKTsKICAgICAgICAgICAgICBjb25zdCByb3cgPSBBcnJheS5pc0FycmF5KGNyZWF0ZWQpID8gY3JlYXRlZFswXSA6IGNyZWF0ZWQ7CiAgICAgICAgICAgICAgaWYgKHJvdyAmJiByb3cuaWQpIE9iamVjdC5hc3NpZ24ob3B0aW1pc3RpYywgcm93KTsKICAgICAgICAgICAgfQogICAgICAgICAgfSBjYXRjaCAoZSkge30KICAgICAgICB9LAogICAgICAgIGFzeW5jIHJlbW92ZShpdGVtKSB7CiAgICAgICAgICB0aGlzLml0ZW1zID0gdGhpcy5pdGVtcy5maWx0ZXIoaSA9PiBpLmlkICE9PSBpdGVtLmlkKTsKICAgICAgICAgIHRyeSB7CiAgICAgICAgICAgIGF3YWl0IGZldGNoKCcvd2ViaG9vay9wYWNrbGlzdGUvZGVsZXRlJywgewogICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLCBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSwKICAgICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGlkOiBpdGVtLmlkIH0pCiAgICAgICAgICAgIH0pOwogICAgICAgICAgfSBjYXRjaCAoZSkge30KICAgICAgICB9CiAgICAgIH07CiAgICB9CiAgPC9zY3JpcHQ+CjwvYm9keT4KPC9odG1sPgo=';
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
