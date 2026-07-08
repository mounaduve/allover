import { workflow, node, trigger, expr } from '@n8n/workflow-sdk';

const HTML_B64 = 'PCFET0NUWVBFIGh0bWw+CjxodG1sIGxhbmc9ImRlIj4KPGhlYWQ+CiAgPG1ldGEgY2hhcnNldD0iVVRGLTgiPgogIDxtZXRhIG5hbWU9InZpZXdwb3J0IiBjb250ZW50PSJ3aWR0aD1kZXZpY2Utd2lkdGgsIGluaXRpYWwtc2NhbGU9MS4wIj4KICA8dGl0bGU+VXJsYXVic3BhY2tsaXN0ZTwvdGl0bGU+CiAgPHNjcmlwdCBzcmM9Imh0dHBzOi8vY2RuLnRhaWx3aW5kY3NzLmNvbSI+PC9zY3JpcHQ+CiAgPHNjcmlwdCBkZWZlciBzcmM9Imh0dHBzOi8vY2RuLmpzZGVsaXZyLm5ldC9ucG0vYWxwaW5lanNAMy9kaXN0L2Nkbi5taW4uanMiPjwvc2NyaXB0PgogIDxzdHlsZT4KICAgIFt4LWNsb2FrXSB7IGRpc3BsYXk6IG5vbmUgIWltcG9ydGFudDsgfQogICAgYm9keSB7IC13ZWJraXQtdGFwLWhpZ2hsaWdodC1jb2xvcjogdHJhbnNwYXJlbnQ7IH0KICA8L3N0eWxlPgo8L2hlYWQ+Cjxib2R5IGNsYXNzPSJiZy1zbGF0ZS0xMDAgbWluLWgtc2NyZWVuIHRleHQtc2xhdGUtODAwIj4KICA8ZGl2IHgtZGF0YT0icGFja2xpc3RlKCkiIHgtaW5pdD0iaW5pdCgpIiB4LWNsb2FrPgoKICAgIDxkaXYgY2xhc3M9Im1heC13LXhsIG14LWF1dG8gcHgtNCBweS02IHBiLTMyIj4KICAgICAgPCEtLSBLb3BmIC0tPgogICAgICA8aGVhZGVyIGNsYXNzPSJtYi00Ij4KICAgICAgICA8ZGl2IGNsYXNzPSJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4iPgogICAgICAgICAgPGgxIGNsYXNzPSJ0ZXh0LTJ4bCBmb250LWJvbGQgdGV4dC1zbGF0ZS05MDAiPvCfp7MgVXJsYXVic3BhY2tsaXN0ZTwvaDE+CiAgICAgICAgICA8YnV0dG9uIEBjbGljaz0ibG9hZCgpIiA6Y2xhc3M9ImxvYWRpbmcgJiYgJ2FuaW1hdGUtc3BpbiciIGNsYXNzPSJ0ZXh0LXNsYXRlLTQwMCB0ZXh0LXhsIiB0aXRsZT0iQWt0dWFsaXNpZXJlbiI+4p+zPC9idXR0b24+CiAgICAgICAgPC9kaXY+CiAgICAgICAgPHAgY2xhc3M9InRleHQtc20gdGV4dC1zbGF0ZS01MDAgbXQtMSIgeC10ZXh0PSJzdGF0dXNUZXh0KCkiPjwvcD4KICAgICAgICA8ZGl2IGNsYXNzPSJtdC0zIGgtMiB3LWZ1bGwgcm91bmRlZC1mdWxsIGJnLXNsYXRlLTIwMCBvdmVyZmxvdy1oaWRkZW4iPgogICAgICAgICAgPGRpdiBjbGFzcz0iaC1mdWxsIGJnLWVtZXJhbGQtNTAwIHRyYW5zaXRpb24tYWxsIGR1cmF0aW9uLTMwMCIgOnN0eWxlPSJgd2lkdGg6ICR7cHJvZ3Jlc3MoKX0lYCI+PC9kaXY+CiAgICAgICAgPC9kaXY+CiAgICAgICAgPHAgY2xhc3M9InRleHQtWzExcHhdIHRleHQtc2xhdGUtNDAwIG10LTIiPlRpcHA6IGF1ZiBkaWUgw5xiZXJzY2hyaWZ0IHRpcHBlbiA9IGVpbi0vYXVza2xhcHBlbiDCtyBtaXQg4pay4pa8IGRpZSBSdWJyaWsgdmVyc2NoaWViZW4gwrcgYXVmIGRlbiBUZXh0IHRpcHBlbiA9IHVtYmVuZW5uZW4gJmFtcDsgUnVicmlrIHdlY2hzZWxuLjwvcD4KICAgICAgPC9oZWFkZXI+CgogICAgICA8IS0tIExpc3RlIG5hY2ggS2F0ZWdvcmllIC0tPgogICAgICA8dGVtcGxhdGUgeC1mb3I9ImNhdCBpbiBjYXRlZ29yaWVzKCkiIDprZXk9ImNhdCI+CiAgICAgICAgPHNlY3Rpb24gY2xhc3M9Im1iLTQiPgogICAgICAgICAgPGgyIGNsYXNzPSJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBtYi0yIHB4LTEiPgogICAgICAgICAgICA8c3BhbiBAY2xpY2s9InRvZ2dsZUNvbGxhcHNlKGNhdCkiIGNsYXNzPSJmbGV4LTEgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgY3Vyc29yLXBvaW50ZXIgc2VsZWN0LW5vbmUiPgogICAgICAgICAgICAgIDxzcGFuIGNsYXNzPSJ3LTMgdGV4dC1zbGF0ZS00MDAgdGV4dC14cyIgeC10ZXh0PSJjb2xsYXBzZWRbY2F0XSA/ICfilrgnIDogJ+KWviciPjwvc3Bhbj4KICAgICAgICAgICAgICA8c3BhbiBjbGFzcz0idGV4dC14cyBmb250LXNlbWlib2xkIHVwcGVyY2FzZSB0cmFja2luZy13aWRlIHRleHQtc2xhdGUtNTAwIiB4LXRleHQ9ImNhdCI+PC9zcGFuPgogICAgICAgICAgICAgIDxzcGFuIGNsYXNzPSJ0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTQwMCIgeC10ZXh0PSJkb25lQ291bnQoY2F0KSArICcvJyArIGl0ZW1zSW4oY2F0KS5sZW5ndGgiPjwvc3Bhbj4KICAgICAgICAgICAgPC9zcGFuPgogICAgICAgICAgICA8YnV0dG9uIEBjbGljaz0icmVuYW1lQ2F0KGNhdCkiIGNsYXNzPSJ0ZXh0LXNsYXRlLTQwMCBob3Zlcjp0ZXh0LXNsYXRlLTYwMCB0ZXh0LXNtIHB4LTEgbGVhZGluZy1ub25lIiB0aXRsZT0iUnVicmlrIHVtYmVuZW5uZW4iPuKcjjwvYnV0dG9uPgogICAgICAgICAgICA8YnV0dG9uIEBjbGljaz0ibW92ZUNhdChjYXQsIC0xKSIgY2xhc3M9InRleHQtc2xhdGUtNDAwIGhvdmVyOnRleHQtc2xhdGUtNjAwIHRleHQtc20gcHgtMSBsZWFkaW5nLW5vbmUiIHRpdGxlPSJuYWNoIG9iZW4iPuKWsjwvYnV0dG9uPgogICAgICAgICAgICA8YnV0dG9uIEBjbGljaz0ibW92ZUNhdChjYXQsIDEpIiBjbGFzcz0idGV4dC1zbGF0ZS00MDAgaG92ZXI6dGV4dC1zbGF0ZS02MDAgdGV4dC1zbSBweC0xIGxlYWRpbmctbm9uZSIgdGl0bGU9Im5hY2ggdW50ZW4iPuKWvDwvYnV0dG9uPgogICAgICAgICAgPC9oMj4KICAgICAgICAgIDxkaXYgeC1zaG93PSIhY29sbGFwc2VkW2NhdF0iIGNsYXNzPSJiZy13aGl0ZSByb3VuZGVkLTJ4bCBzaGFkb3ctc20gZGl2aWRlLXkgZGl2aWRlLXNsYXRlLTEwMCBvdmVyZmxvdy1oaWRkZW4iPgogICAgICAgICAgICA8dGVtcGxhdGUgeC1mb3I9Iml0ZW0gaW4gaXRlbXNJbihjYXQpIiA6a2V5PSJpdGVtLmlkIj4KICAgICAgICAgICAgICA8ZGl2IGNsYXNzPSJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBweC0zIHB5LTMgYWN0aXZlOmJnLXNsYXRlLTUwIj4KICAgICAgICAgICAgICAgIDxidXR0b24geC1zaG93PSJlZGl0aW5nSWQgIT09IGl0ZW0uaWQiIEBjbGljaz0idG9nZ2xlKGl0ZW0pIgogICAgICAgICAgICAgICAgICA6Y2xhc3M9Iml0ZW0uY29tcGxldGVkID8gJ2JnLWVtZXJhbGQtNTAwIGJvcmRlci1lbWVyYWxkLTUwMCcgOiAnYm9yZGVyLXNsYXRlLTMwMCciCiAgICAgICAgICAgICAgICAgIGNsYXNzPSJzaHJpbmstMCB3LTYgaC02IHJvdW5kZWQtZnVsbCBib3JkZXItMiBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciB0cmFuc2l0aW9uLWNvbG9ycyI+CiAgICAgICAgICAgICAgICAgIDxzcGFuIHgtc2hvdz0iaXRlbS5jb21wbGV0ZWQiIGNsYXNzPSJ0ZXh0LXdoaXRlIHRleHQtc20iPuKckzwvc3Bhbj4KICAgICAgICAgICAgICAgIDwvYnV0dG9uPgoKICAgICAgICAgICAgICAgIDwhLS0gQW56ZWlnZSAtLT4KICAgICAgICAgICAgICAgIDxzcGFuIHgtc2hvdz0iZWRpdGluZ0lkICE9PSBpdGVtLmlkIgogICAgICAgICAgICAgICAgICBAY2xpY2s9InN0YXJ0RWRpdChpdGVtKSIKICAgICAgICAgICAgICAgICAgY2xhc3M9ImZsZXgtMSB0ZXh0LVsxNXB4XSBjdXJzb3ItdGV4dCIKICAgICAgICAgICAgICAgICAgOmNsYXNzPSJpdGVtLmNvbXBsZXRlZCAmJiAnbGluZS10aHJvdWdoIHRleHQtc2xhdGUtNDAwJyIKICAgICAgICAgICAgICAgICAgeC10ZXh0PSJpdGVtLnRpdGxlIj48L3NwYW4+CiAgICAgICAgICAgICAgICA8YnV0dG9uIHgtc2hvdz0iZWRpdGluZ0lkICE9PSBpdGVtLmlkIiBAY2xpY2s9InJlbW92ZShpdGVtKSIgY2xhc3M9InNocmluay0wIHRleHQtc2xhdGUtMzAwIGhvdmVyOnRleHQtcm9zZS01MDAgdGV4dC1sZyBweC0xIj7DlzwvYnV0dG9uPgoKICAgICAgICAgICAgICAgIDwhLS0gQmVhcmJlaXRlbjogVGV4dCB1bXNjaHJlaWJlbiArIEthdGVnb3JpZSB3ZWNoc2VsbiAtLT4KICAgICAgICAgICAgICAgIDxkaXYgeC1zaG93PSJlZGl0aW5nSWQgPT09IGl0ZW0uaWQiIGNsYXNzPSJmbGV4LTEgZmxleCBmbGV4LWNvbCBnYXAtMSIgQGNsaWNrLnN0b3A+CiAgICAgICAgICAgICAgICAgIDxpbnB1dCB4LW1vZGVsPSJlZGl0VGV4dCIKICAgICAgICAgICAgICAgICAgICBAa2V5ZG93bi5lbnRlcj0ic2F2ZUVkaXQoaXRlbSkiIEBrZXlkb3duLmVzY2FwZT0iY2FuY2VsRWRpdCgpIgogICAgICAgICAgICAgICAgICAgIHgtcmVmPSJlZGl0IgogICAgICAgICAgICAgICAgICAgIGNsYXNzPSJ3LWZ1bGwgdGV4dC1bMTVweF0gYm9yZGVyIGJvcmRlci1lbWVyYWxkLTQwMCByb3VuZGVkIHB4LTIgcHktMSBmb2N1czpvdXRsaW5lLW5vbmUiPgogICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPSJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiI+CiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9InRleHQteHMgdGV4dC1zbGF0ZS00MDAgc2hyaW5rLTAiPlJ1YnJpazo8L3NwYW4+CiAgICAgICAgICAgICAgICAgICAgPHNlbGVjdCB4LW1vZGVsPSJpdGVtLmNhdGVnb3J5IiBAY2hhbmdlPSJwZXJzaXN0KGl0ZW0pIgogICAgICAgICAgICAgICAgICAgICAgY2xhc3M9ImZsZXgtMSB0ZXh0LXNtIGJvcmRlciBib3JkZXItc2xhdGUtMzAwIHJvdW5kZWQgcHgtMiBweS0xIGJnLXdoaXRlIHRleHQtc2xhdGUtNjAwIj4KICAgICAgICAgICAgICAgICAgICAgIDx0ZW1wbGF0ZSB4LWZvcj0iYyBpbiBhbGxDYXRlZ29yaWVzKCkiIDprZXk9ImMiPjxvcHRpb24gOnZhbHVlPSJjIiB4LXRleHQ9ImMiPjwvb3B0aW9uPjwvdGVtcGxhdGU+CiAgICAgICAgICAgICAgICAgICAgPC9zZWxlY3Q+CiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBAY2xpY2s9InNhdmVFZGl0KGl0ZW0pIiBjbGFzcz0ic2hyaW5rLTAgcm91bmRlZCBiZy1lbWVyYWxkLTYwMCB0ZXh0LXdoaXRlIHRleHQtc20gcHgtMyBweS0xIj5GZXJ0aWc8L2J1dHRvbj4KICAgICAgICAgICAgICAgICAgPC9kaXY+CiAgICAgICAgICAgICAgICA8L2Rpdj4KICAgICAgICAgICAgICA8L2Rpdj4KICAgICAgICAgICAgPC90ZW1wbGF0ZT4KICAgICAgICAgIDwvZGl2PgogICAgICAgIDwvc2VjdGlvbj4KICAgICAgPC90ZW1wbGF0ZT4KCiAgICAgIDxwIHgtc2hvdz0iaXRlbXMubGVuZ3RoID09PSAwICYmICFsb2FkaW5nIiBjbGFzcz0idGV4dC1jZW50ZXIgdGV4dC1zbGF0ZS00MDAgcHktMTAiPgogICAgICAgIE5vY2ggbmljaHRzIGRyYXVmIOKAkyBmw7xnZSB1bnRlbiBkZW4gZXJzdGVuIFB1bmt0IGhpbnp1LiDwn5GHCiAgICAgIDwvcD4KICAgIDwvZGl2PgoKICAgIDwhLS0gRWluZ2FiZWxlaXN0ZSB1bnRlbiAtLT4KICAgIDxmb3JtIEBzdWJtaXQucHJldmVudD0ic3VibWl0QWRkKCkiCiAgICAgIGNsYXNzPSJmaXhlZCBib3R0b20tMCBpbnNldC14LTAgYm9yZGVyLXQgYm9yZGVyLXNsYXRlLTIwMCBiZy13aGl0ZS85NSBiYWNrZHJvcC1ibHVyIHB4LTQgcHktMyI+CiAgICAgIDxkaXYgY2xhc3M9Im1heC13LXhsIG14LWF1dG8gZmxleCBnYXAtMiI+CiAgICAgICAgPHNlbGVjdCB4LW1vZGVsPSJuZXdDYXQiIGNsYXNzPSJyb3VuZGVkLXhsIGJvcmRlciBib3JkZXItc2xhdGUtMzAwIGJnLXdoaXRlIHB4LTIgcHktMiB0ZXh0LXNtIHRleHQtc2xhdGUtNjAwIj4KICAgICAgICAgIDx0ZW1wbGF0ZSB4LWZvcj0iYyBpbiBhbGxDYXRlZ29yaWVzKCkiIDprZXk9ImMiPjxvcHRpb24geC10ZXh0PSJjIiA6dmFsdWU9ImMiPjwvb3B0aW9uPjwvdGVtcGxhdGU+CiAgICAgICAgPC9zZWxlY3Q+CiAgICAgICAgPGlucHV0IHgtbW9kZWw9Im5ld1RpdGxlIiB0eXBlPSJ0ZXh0IiBwbGFjZWhvbGRlcj0iV2FzIG5vY2ggZWlucGFja2VuPyIgZW50ZXJrZXloaW50PSJkb25lIgogICAgICAgICAgY2xhc3M9ImZsZXgtMSByb3VuZGVkLXhsIGJvcmRlciBib3JkZXItc2xhdGUtMzAwIHB4LTMgcHktMiB0ZXh0LVsxNXB4XSBmb2N1czpvdXRsaW5lLW5vbmUgZm9jdXM6cmluZy0yIGZvY3VzOnJpbmctZW1lcmFsZC00MDAiPgogICAgICAgIDxidXR0b24gdHlwZT0ic3VibWl0IiBjbGFzcz0icm91bmRlZC14bCBiZy1lbWVyYWxkLTYwMCB0ZXh0LXdoaXRlIHB4LTQgcHktMiB0ZXh0LWxnIGZvbnQtbWVkaXVtIGFjdGl2ZTpiZy1lbWVyYWxkLTcwMCI+KzwvYnV0dG9uPgogICAgICA8L2Rpdj4KICAgIDwvZm9ybT4KCiAgPC9kaXY+CgogIDxzY3JpcHQgaWQ9Il9fZGF0YSIgdHlwZT0iYXBwbGljYXRpb24vanNvbiI+X19EQVRBX1BMQUNFSE9MREVSX188L3NjcmlwdD4KICA8c2NyaXB0PgogICAgY29uc3QgQ0FUUyA9IFsnRG9rdW1lbnRlJywgJ0tsZWlkdW5nJywgJ1NjaHVoZScsICdSYW5qYScsICdUYXJlaycsICdPbGxpJywgJ0t1bHR1cmJldXRlbCcsICdNZWRpa2FtZW50ZScsICdTdXBwbGVtZW50cycsICdUZWNobmlrJywgJ1N0cmFuZCAmIFdhc3NlcicsICdTcGllbGUnLCAnVm9yIGRlciBBYnJlaXNlJywgJ1NvbnN0aWdlcyddOwoKICAgIGZ1bmN0aW9uIHBhY2tsaXN0ZSgpIHsKICAgICAgcmV0dXJuIHsKICAgICAgICBpdGVtczogW10sCiAgICAgICAgbG9hZGluZzogZmFsc2UsCiAgICAgICAgZWRpdGluZ0lkOiBudWxsLAogICAgICAgIGVkaXRUZXh0OiAnJywKICAgICAgICBuZXdUaXRsZTogJycsCiAgICAgICAgbmV3Q2F0OiAnU29uc3RpZ2VzJywKICAgICAgICBfY2F0ZWdvcmllczogQ0FUUywKICAgICAgICBjb2xsYXBzZWQ6IHt9LAogICAgICAgIGNhdE9yZGVyOiBDQVRTLnNsaWNlKCksCgogICAgICAgIGluaXQoKSB7CiAgICAgICAgICB0cnkgewogICAgICAgICAgICB0aGlzLml0ZW1zID0gSlNPTi5wYXJzZShhdG9iKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdfX2RhdGEnKS50ZXh0Q29udGVudCkpIHx8IFtdOwogICAgICAgICAgfSBjYXRjaCAoZSkgeyB0aGlzLml0ZW1zID0gW107IH0KICAgICAgICAgIC8vIEFuc2ljaHQtRWluc3RlbGx1bmdlbiBsb2thbCBwcm8gR2Vyw6R0IChuaWNodCBtaXQgZGVtIGFuZGVyZW4gZ2V0ZWlsdCkKICAgICAgICAgIHRyeSB7IHRoaXMuY29sbGFwc2VkID0gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgncGxfY29sbGFwc2VkJykgfHwgJ3t9JykgfHwge307IH0gY2F0Y2ggKGUpIHsgdGhpcy5jb2xsYXBzZWQgPSB7fTsgfQogICAgICAgICAgdHJ5IHsKICAgICAgICAgICAgY29uc3Qgc2F2ZWQgPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdwbF9jYXRPcmRlcicpIHx8ICdudWxsJyk7CiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHNhdmVkKSAmJiBzYXZlZC5sZW5ndGgpIHsKICAgICAgICAgICAgICB0aGlzLmNhdE9yZGVyID0gc2F2ZWQuY29uY2F0KENBVFMuZmlsdGVyKGMgPT4gIXNhdmVkLmluY2x1ZGVzKGMpKSk7CiAgICAgICAgICAgIH0KICAgICAgICAgIH0gY2F0Y2ggKGUpIHt9CiAgICAgICAgICAvLyBBbGxlIH44IFNlay4gbmV1IGxhZGVuLCBkYW1pdCBpaHIgYmVpZGUgZGllc2VsYmVuIEjDpGtjaGVuIHNlaHQKICAgICAgICAgIHNldEludGVydmFsKCgpID0+IHRoaXMubG9hZCgpLCA4MDAwKTsKICAgICAgICB9LAogICAgICAgIGNhdGVnb3JpZXMoKSB7CiAgICAgICAgICBjb25zdCBwcmVzZW50ID0gWy4uLm5ldyBTZXQodGhpcy5pdGVtcy5tYXAoaSA9PiBpLmNhdGVnb3J5IHx8ICdTb25zdGlnZXMnKSldOwogICAgICAgICAgY29uc3Qgb3JkZXJlZCA9IHRoaXMuY2F0T3JkZXIuZmlsdGVyKGMgPT4gcHJlc2VudC5pbmNsdWRlcyhjKSk7CiAgICAgICAgICByZXR1cm4gb3JkZXJlZC5jb25jYXQocHJlc2VudC5maWx0ZXIoYyA9PiAhdGhpcy5jYXRPcmRlci5pbmNsdWRlcyhjKSkpOwogICAgICAgIH0sCiAgICAgICAgaXRlbXNJbihjYXQpIHsKICAgICAgICAgIHJldHVybiB0aGlzLml0ZW1zLmZpbHRlcihpID0+IChpLmNhdGVnb3J5IHx8ICdTb25zdGlnZXMnKSA9PT0gY2F0KTsKICAgICAgICB9LAogICAgICAgIGRvbmVDb3VudChjYXQpIHsKICAgICAgICAgIHJldHVybiB0aGlzLml0ZW1zSW4oY2F0KS5maWx0ZXIoaSA9PiBpLmNvbXBsZXRlZCkubGVuZ3RoOwogICAgICAgIH0sCiAgICAgICAgLy8gYWxsZSB3w6RobGJhcmVuIFJ1YnJpa2VuIChTdGFuZGFyZCArIHZvcmhhbmRlbmUgKyB1bWJlbmFubnRlKQogICAgICAgIGFsbENhdGVnb3JpZXMoKSB7CiAgICAgICAgICBjb25zdCBvdXQgPSBbXTsKICAgICAgICAgIHRoaXMuY2F0T3JkZXIuZm9yRWFjaChjID0+IHsgaWYgKCFvdXQuaW5jbHVkZXMoYykpIG91dC5wdXNoKGMpOyB9KTsKICAgICAgICAgIHRoaXMuaXRlbXMuZm9yRWFjaChpID0+IHsgY29uc3QgYyA9IGkuY2F0ZWdvcnkgfHwgJ1NvbnN0aWdlcyc7IGlmICghb3V0LmluY2x1ZGVzKGMpKSBvdXQucHVzaChjKTsgfSk7CiAgICAgICAgICByZXR1cm4gb3V0OwogICAgICAgIH0sCiAgICAgICAgLy8gUnVicmlrIHVtYmVuZW5uZW4gKGFsbGUgRWludHLDpGdlIGRlciBSdWJyaWsgd2FuZGVybiBtaXQpCiAgICAgICAgcmVuYW1lQ2F0KGNhdCkgewogICAgICAgICAgY29uc3QgbmFtZSA9ICh3aW5kb3cucHJvbXB0KCdSdWJyaWsgdW1iZW5lbm5lbjonLCBjYXQpIHx8ICcnKS50cmltKCk7CiAgICAgICAgICBpZiAoIW5hbWUgfHwgbmFtZSA9PT0gY2F0KSByZXR1cm47CiAgICAgICAgICB0aGlzLml0ZW1zLmZvckVhY2goaXQgPT4gewogICAgICAgICAgICBpZiAoKGl0LmNhdGVnb3J5IHx8ICdTb25zdGlnZXMnKSA9PT0gY2F0KSB7IGl0LmNhdGVnb3J5ID0gbmFtZTsgdGhpcy5wZXJzaXN0KGl0KTsgfQogICAgICAgICAgfSk7CiAgICAgICAgICB0aGlzLmNhdE9yZGVyID0gdGhpcy5jYXRPcmRlci5tYXAoYyA9PiBjID09PSBjYXQgPyBuYW1lIDogYyk7CiAgICAgICAgICBpZiAoIXRoaXMuY2F0T3JkZXIuaW5jbHVkZXMobmFtZSkpIHRoaXMuY2F0T3JkZXIucHVzaChuYW1lKTsKICAgICAgICAgIGlmIChjYXQgaW4gdGhpcy5jb2xsYXBzZWQpIHsgdGhpcy5jb2xsYXBzZWRbbmFtZV0gPSB0aGlzLmNvbGxhcHNlZFtjYXRdOyBkZWxldGUgdGhpcy5jb2xsYXBzZWRbY2F0XTsgfQogICAgICAgICAgaWYgKHRoaXMubmV3Q2F0ID09PSBjYXQpIHRoaXMubmV3Q2F0ID0gbmFtZTsKICAgICAgICAgIHRyeSB7CiAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdwbF9jYXRPcmRlcicsIEpTT04uc3RyaW5naWZ5KHRoaXMuY2F0T3JkZXIpKTsKICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ3BsX2NvbGxhcHNlZCcsIEpTT04uc3RyaW5naWZ5KHRoaXMuY29sbGFwc2VkKSk7CiAgICAgICAgICB9IGNhdGNoIChlKSB7fQogICAgICAgIH0sCiAgICAgICAgcHJvZ3Jlc3MoKSB7CiAgICAgICAgICBpZiAoIXRoaXMuaXRlbXMubGVuZ3RoKSByZXR1cm4gMDsKICAgICAgICAgIHJldHVybiBNYXRoLnJvdW5kKDEwMCAqIHRoaXMuaXRlbXMuZmlsdGVyKGkgPT4gaS5jb21wbGV0ZWQpLmxlbmd0aCAvIHRoaXMuaXRlbXMubGVuZ3RoKTsKICAgICAgICB9LAogICAgICAgIHN0YXR1c1RleHQoKSB7CiAgICAgICAgICBjb25zdCBkb25lID0gdGhpcy5pdGVtcy5maWx0ZXIoaSA9PiBpLmNvbXBsZXRlZCkubGVuZ3RoOwogICAgICAgICAgcmV0dXJuIGAke2RvbmV9IHZvbiAke3RoaXMuaXRlbXMubGVuZ3RofSBlaW5nZXBhY2t0YDsKICAgICAgICB9LAoKICAgICAgICAvLyBBYnNjaG5pdHQgZWluLS9hdXNrbGFwcGVuIChsb2thbCBnZXNwZWljaGVydCkKICAgICAgICB0b2dnbGVDb2xsYXBzZShjYXQpIHsKICAgICAgICAgIHRoaXMuY29sbGFwc2VkW2NhdF0gPSAhdGhpcy5jb2xsYXBzZWRbY2F0XTsKICAgICAgICAgIHRyeSB7IGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdwbF9jb2xsYXBzZWQnLCBKU09OLnN0cmluZ2lmeSh0aGlzLmNvbGxhcHNlZCkpOyB9IGNhdGNoIChlKSB7fQogICAgICAgIH0sCgogICAgICAgIC8vIEFic2Nobml0dCBob2NoL3J1bnRlciB2ZXJzY2hpZWJlbiAoUmVpaGVuZm9sZ2UgbG9rYWwgZ2VzcGVpY2hlcnQpCiAgICAgICAgbW92ZUNhdChjYXQsIGRpcikgewogICAgICAgICAgY29uc3QgdmlzID0gdGhpcy5jYXRlZ29yaWVzKCk7CiAgICAgICAgICBjb25zdCBpID0gdmlzLmluZGV4T2YoY2F0KTsKICAgICAgICAgIGNvbnN0IGogPSBpICsgZGlyOwogICAgICAgICAgaWYgKGkgPCAwIHx8IGogPCAwIHx8IGogPj0gdmlzLmxlbmd0aCkgcmV0dXJuOwogICAgICAgICAgdmlzLnNwbGljZShpLCAxKTsKICAgICAgICAgIHZpcy5zcGxpY2UoaiwgMCwgY2F0KTsKICAgICAgICAgIHRoaXMuY2F0T3JkZXIgPSB2aXMuY29uY2F0KHRoaXMuY2F0T3JkZXIuZmlsdGVyKGMgPT4gIXZpcy5pbmNsdWRlcyhjKSkpOwogICAgICAgICAgdHJ5IHsgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ3BsX2NhdE9yZGVyJywgSlNPTi5zdHJpbmdpZnkodGhpcy5jYXRPcmRlcikpOyB9IGNhdGNoIChlKSB7fQogICAgICAgIH0sCgogICAgICAgIGFzeW5jIGxvYWQoKSB7CiAgICAgICAgICBpZiAodGhpcy5lZGl0aW5nSWQgIT09IG51bGwpIHJldHVybjsgLy8gbmljaHQgbWl0dGVuIGltIEJlYXJiZWl0ZW4gbmV1IGxhZGVuCiAgICAgICAgICB0aGlzLmxvYWRpbmcgPSB0cnVlOwogICAgICAgICAgdHJ5IHsKICAgICAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJy93ZWJob29rL3BhY2tsaXN0ZS9pdGVtcycsIHsgY2FjaGU6ICduby1zdG9yZScgfSk7CiAgICAgICAgICAgIGlmIChyZXMub2spIHRoaXMuaXRlbXMgPSBhd2FpdCByZXMuanNvbigpOwogICAgICAgICAgfSBjYXRjaCAoZSkge30gZmluYWxseSB7IHRoaXMubG9hZGluZyA9IGZhbHNlOyB9CiAgICAgICAgfSwKICAgICAgICBhc3luYyB0b2dnbGUoaXRlbSkgewogICAgICAgICAgaXRlbS5jb21wbGV0ZWQgPSAhaXRlbS5jb21wbGV0ZWQ7CiAgICAgICAgICB0cnkgewogICAgICAgICAgICBhd2FpdCBmZXRjaCgnL3dlYmhvb2svcGFja2xpc3RlL3RvZ2dsZScsIHsKICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJywgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sCiAgICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBpZDogaXRlbS5pZCwgY29tcGxldGVkOiBpdGVtLmNvbXBsZXRlZCB9KQogICAgICAgICAgICB9KTsKICAgICAgICAgIH0gY2F0Y2ggKGUpIHsgaXRlbS5jb21wbGV0ZWQgPSAhaXRlbS5jb21wbGV0ZWQ7IH0KICAgICAgICB9LAoKICAgICAgICAvLyBCZWFyYmVpdGVuIGRlcyBUZXh0ZXMKICAgICAgICBzdGFydEVkaXQoaXRlbSkgewogICAgICAgICAgaWYgKHR5cGVvZiBpdGVtLmlkID09PSAnc3RyaW5nJyAmJiBpdGVtLmlkLnN0YXJ0c1dpdGgoJ3RtcC0nKSkgcmV0dXJuOyAvLyBlcnN0IG5hY2ggZGVtIFNwZWljaGVybgogICAgICAgICAgdGhpcy5lZGl0aW5nSWQgPSBpdGVtLmlkOwogICAgICAgICAgdGhpcy5lZGl0VGV4dCA9IGl0ZW0udGl0bGU7CiAgICAgICAgICB0aGlzLiRuZXh0VGljaygoKSA9PiB7IGlmICh0aGlzLiRyZWZzLmVkaXQpIHsgdGhpcy4kcmVmcy5lZGl0LmZvY3VzKCk7IHRoaXMuJHJlZnMuZWRpdC5zZWxlY3QoKTsgfSB9KTsKICAgICAgICB9LAogICAgICAgIGNhbmNlbEVkaXQoKSB7IHRoaXMuZWRpdGluZ0lkID0gbnVsbDsgdGhpcy5lZGl0VGV4dCA9ICcnOyB9LAogICAgICAgIGFzeW5jIHNhdmVFZGl0KGl0ZW0pIHsKICAgICAgICAgIGlmICh0aGlzLmVkaXRpbmdJZCAhPT0gaXRlbS5pZCkgcmV0dXJuOwogICAgICAgICAgY29uc3QgdCA9ICh0aGlzLmVkaXRUZXh0IHx8ICcnKS50cmltKCk7CiAgICAgICAgICB0aGlzLmVkaXRpbmdJZCA9IG51bGw7CiAgICAgICAgICBpZiAodCAmJiB0ICE9PSBpdGVtLnRpdGxlKSB7CiAgICAgICAgICAgIGl0ZW0udGl0bGUgPSB0OwogICAgICAgICAgICB0aGlzLnBlcnNpc3QoaXRlbSk7CiAgICAgICAgICB9CiAgICAgICAgfSwKCiAgICAgICAgLy8gw4RuZGVydW5nIChUaXRlbCB1bmQvb2RlciBLYXRlZ29yaWUpIHNwZWljaGVybgogICAgICAgIGFzeW5jIHBlcnNpc3QoaXRlbSkgewogICAgICAgICAgdHJ5IHsKICAgICAgICAgICAgYXdhaXQgZmV0Y2goJy93ZWJob29rL3BhY2tsaXN0ZS91cGRhdGUnLCB7CiAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LAogICAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgaWQ6IGl0ZW0uaWQsIHRpdGxlOiBpdGVtLnRpdGxlLCBjYXRlZ29yeTogaXRlbS5jYXRlZ29yeSB9KQogICAgICAgICAgICB9KTsKICAgICAgICAgIH0gY2F0Y2ggKGUpIHt9CiAgICAgICAgfSwKCiAgICAgICAgYXN5bmMgc3VibWl0QWRkKCkgewogICAgICAgICAgY29uc3QgdGl0bGUgPSAodGhpcy5uZXdUaXRsZSB8fCAnJykudHJpbSgpOwogICAgICAgICAgaWYgKCF0aXRsZSkgcmV0dXJuOwogICAgICAgICAgY29uc3QgY2F0ZWdvcnkgPSB0aGlzLm5ld0NhdCB8fCAnU29uc3RpZ2VzJzsKICAgICAgICAgIHRoaXMubmV3VGl0bGUgPSAnJzsKICAgICAgICAgIGNvbnN0IG9wdGltaXN0aWMgPSB7IGlkOiAndG1wLScgKyBEYXRlLm5vdygpLCB0aXRsZTogdGl0bGUsIGNhdGVnb3J5OiBjYXRlZ29yeSwgY29tcGxldGVkOiBmYWxzZSB9OwogICAgICAgICAgdGhpcy5pdGVtcy5wdXNoKG9wdGltaXN0aWMpOwogICAgICAgICAgdHJ5IHsKICAgICAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJy93ZWJob29rL3BhY2tsaXN0ZS9hZGQnLCB7CiAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LAogICAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgdGl0bGU6IHRpdGxlLCBjYXRlZ29yeTogY2F0ZWdvcnkgfSkKICAgICAgICAgICAgfSk7CiAgICAgICAgICAgIGlmIChyZXMub2spIHsKICAgICAgICAgICAgICBjb25zdCBjcmVhdGVkID0gYXdhaXQgcmVzLmpzb24oKTsKICAgICAgICAgICAgICBjb25zdCByb3cgPSBBcnJheS5pc0FycmF5KGNyZWF0ZWQpID8gY3JlYXRlZFswXSA6IGNyZWF0ZWQ7CiAgICAgICAgICAgICAgaWYgKHJvdyAmJiByb3cuaWQpIE9iamVjdC5hc3NpZ24ob3B0aW1pc3RpYywgcm93KTsKICAgICAgICAgICAgfQogICAgICAgICAgfSBjYXRjaCAoZSkge30KICAgICAgICB9LAogICAgICAgIGFzeW5jIHJlbW92ZShpdGVtKSB7CiAgICAgICAgICB0aGlzLml0ZW1zID0gdGhpcy5pdGVtcy5maWx0ZXIoaSA9PiBpLmlkICE9PSBpdGVtLmlkKTsKICAgICAgICAgIHRyeSB7CiAgICAgICAgICAgIGF3YWl0IGZldGNoKCcvd2ViaG9vay9wYWNrbGlzdGUvZGVsZXRlJywgewogICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLCBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSwKICAgICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGlkOiBpdGVtLmlkIH0pCiAgICAgICAgICAgIH0pOwogICAgICAgICAgfSBjYXRjaCAoZSkge30KICAgICAgICB9CiAgICAgIH07CiAgICB9CiAgPC9zY3JpcHQ+CjwvYm9keT4KPC9odG1sPgo=';
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
