import { workflow, node, trigger, expr } from '@n8n/workflow-sdk';

const HTML_B64 = 'PCFET0NUWVBFIGh0bWw+CjxodG1sIGxhbmc9ImRlIj4KPGhlYWQ+CiAgPG1ldGEgY2hhcnNldD0iVVRGLTgiPgogIDxtZXRhIG5hbWU9InZpZXdwb3J0IiBjb250ZW50PSJ3aWR0aD1kZXZpY2Utd2lkdGgsIGluaXRpYWwtc2NhbGU9MS4wIj4KICA8dGl0bGU+VXJsYXVic3BhY2tsaXN0ZTwvdGl0bGU+CiAgPHNjcmlwdCBzcmM9Imh0dHBzOi8vY2RuLnRhaWx3aW5kY3NzLmNvbSI+PC9zY3JpcHQ+CiAgPHNjcmlwdCBkZWZlciBzcmM9Imh0dHBzOi8vY2RuLmpzZGVsaXZyLm5ldC9ucG0vYWxwaW5lanNAMy9kaXN0L2Nkbi5taW4uanMiPjwvc2NyaXB0PgogIDxzdHlsZT4KICAgIFt4LWNsb2FrXSB7IGRpc3BsYXk6IG5vbmUgIWltcG9ydGFudDsgfQogICAgYm9keSB7IC13ZWJraXQtdGFwLWhpZ2hsaWdodC1jb2xvcjogdHJhbnNwYXJlbnQ7IH0KICA8L3N0eWxlPgo8L2hlYWQ+Cjxib2R5IGNsYXNzPSJiZy1zbGF0ZS0xMDAgbWluLWgtc2NyZWVuIHRleHQtc2xhdGUtODAwIj4KICA8ZGl2IHgtZGF0YT0icGFja2xpc3RlKCkiIHgtaW5pdD0iaW5pdCgpIiB4LWNsb2FrPgoKICAgIDxkaXYgY2xhc3M9Im1heC13LXhsIG14LWF1dG8gcHgtNCBweS02IHBiLTMyIj4KICAgICAgPCEtLSBLb3BmIC0tPgogICAgICA8aGVhZGVyIGNsYXNzPSJtYi00Ij4KICAgICAgICA8ZGl2IGNsYXNzPSJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4iPgogICAgICAgICAgPGgxIGNsYXNzPSJ0ZXh0LTJ4bCBmb250LWJvbGQgdGV4dC1zbGF0ZS05MDAiPvCfp7MgVXJsYXVic3BhY2tsaXN0ZTwvaDE+CiAgICAgICAgICA8YnV0dG9uIEBjbGljaz0ibG9hZCgpIiA6Y2xhc3M9ImxvYWRpbmcgJiYgJ2FuaW1hdGUtc3BpbiciIGNsYXNzPSJ0ZXh0LXNsYXRlLTQwMCB0ZXh0LXhsIiB0aXRsZT0iQWt0dWFsaXNpZXJlbiI+4p+zPC9idXR0b24+CiAgICAgICAgPC9kaXY+CiAgICAgICAgPHAgY2xhc3M9InRleHQtc20gdGV4dC1zbGF0ZS01MDAgbXQtMSIgeC10ZXh0PSJzdGF0dXNUZXh0KCkiPjwvcD4KICAgICAgICA8ZGl2IGNsYXNzPSJtdC0zIGgtMiB3LWZ1bGwgcm91bmRlZC1mdWxsIGJnLXNsYXRlLTIwMCBvdmVyZmxvdy1oaWRkZW4iPgogICAgICAgICAgPGRpdiBjbGFzcz0iaC1mdWxsIGJnLWVtZXJhbGQtNTAwIHRyYW5zaXRpb24tYWxsIGR1cmF0aW9uLTMwMCIgOnN0eWxlPSJgd2lkdGg6ICR7cHJvZ3Jlc3MoKX0lYCI+PC9kaXY+CiAgICAgICAgPC9kaXY+CiAgICAgICAgPHAgY2xhc3M9InRleHQtWzExcHhdIHRleHQtc2xhdGUtNDAwIG10LTIiPlRpcHA6IGF1ZiBkaWUgw5xiZXJzY2hyaWZ0IHRpcHBlbiA9IGVpbi0vYXVza2xhcHBlbiDCtyBtaXQg4pay4pa8IGRpZSBSdWJyaWsgdmVyc2NoaWViZW4gwrcgYXVmIGRlbiBUZXh0IHRpcHBlbiA9IHVtYmVuZW5uZW4gJmFtcDsgUnVicmlrIHdlY2hzZWxuLjwvcD4KICAgICAgPC9oZWFkZXI+CgogICAgICA8IS0tIExpc3RlIG5hY2ggS2F0ZWdvcmllIC0tPgogICAgICA8dGVtcGxhdGUgeC1mb3I9ImNhdCBpbiBjYXRlZ29yaWVzKCkiIDprZXk9ImNhdCI+CiAgICAgICAgPHNlY3Rpb24gY2xhc3M9Im1iLTQiPgogICAgICAgICAgPGgyIGNsYXNzPSJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBtYi0yIHB4LTEiPgogICAgICAgICAgICA8c3BhbiBAY2xpY2s9InRvZ2dsZUNvbGxhcHNlKGNhdCkiIGNsYXNzPSJmbGV4LTEgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgY3Vyc29yLXBvaW50ZXIgc2VsZWN0LW5vbmUiPgogICAgICAgICAgICAgIDxzcGFuIGNsYXNzPSJ3LTMgdGV4dC1zbGF0ZS00MDAgdGV4dC14cyIgeC10ZXh0PSJjb2xsYXBzZWRbY2F0XSA/ICfilrgnIDogJ+KWviciPjwvc3Bhbj4KICAgICAgICAgICAgICA8c3BhbiBjbGFzcz0idGV4dC14cyBmb250LXNlbWlib2xkIHVwcGVyY2FzZSB0cmFja2luZy13aWRlIHRleHQtc2xhdGUtNTAwIiB4LXRleHQ9ImNhdCI+PC9zcGFuPgogICAgICAgICAgICAgIDxzcGFuIGNsYXNzPSJ0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTQwMCIgeC10ZXh0PSJkb25lQ291bnQoY2F0KSArICcvJyArIGl0ZW1zSW4oY2F0KS5sZW5ndGgiPjwvc3Bhbj4KICAgICAgICAgICAgPC9zcGFuPgogICAgICAgICAgICA8YnV0dG9uIEBjbGljaz0ibW92ZUNhdChjYXQsIC0xKSIgY2xhc3M9InRleHQtc2xhdGUtNDAwIGhvdmVyOnRleHQtc2xhdGUtNjAwIHRleHQtc20gcHgtMSBsZWFkaW5nLW5vbmUiIHRpdGxlPSJuYWNoIG9iZW4iPuKWsjwvYnV0dG9uPgogICAgICAgICAgICA8YnV0dG9uIEBjbGljaz0ibW92ZUNhdChjYXQsIDEpIiBjbGFzcz0idGV4dC1zbGF0ZS00MDAgaG92ZXI6dGV4dC1zbGF0ZS02MDAgdGV4dC1zbSBweC0xIGxlYWRpbmctbm9uZSIgdGl0bGU9Im5hY2ggdW50ZW4iPuKWvDwvYnV0dG9uPgogICAgICAgICAgPC9oMj4KICAgICAgICAgIDxkaXYgeC1zaG93PSIhY29sbGFwc2VkW2NhdF0iIGNsYXNzPSJiZy13aGl0ZSByb3VuZGVkLTJ4bCBzaGFkb3ctc20gZGl2aWRlLXkgZGl2aWRlLXNsYXRlLTEwMCBvdmVyZmxvdy1oaWRkZW4iPgogICAgICAgICAgICA8dGVtcGxhdGUgeC1mb3I9Iml0ZW0gaW4gaXRlbXNJbihjYXQpIiA6a2V5PSJpdGVtLmlkIj4KICAgICAgICAgICAgICA8ZGl2IGNsYXNzPSJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBweC0zIHB5LTMgYWN0aXZlOmJnLXNsYXRlLTUwIj4KICAgICAgICAgICAgICAgIDxidXR0b24geC1zaG93PSJlZGl0aW5nSWQgIT09IGl0ZW0uaWQiIEBjbGljaz0idG9nZ2xlKGl0ZW0pIgogICAgICAgICAgICAgICAgICA6Y2xhc3M9Iml0ZW0uY29tcGxldGVkID8gJ2JnLWVtZXJhbGQtNTAwIGJvcmRlci1lbWVyYWxkLTUwMCcgOiAnYm9yZGVyLXNsYXRlLTMwMCciCiAgICAgICAgICAgICAgICAgIGNsYXNzPSJzaHJpbmstMCB3LTYgaC02IHJvdW5kZWQtZnVsbCBib3JkZXItMiBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciB0cmFuc2l0aW9uLWNvbG9ycyI+CiAgICAgICAgICAgICAgICAgIDxzcGFuIHgtc2hvdz0iaXRlbS5jb21wbGV0ZWQiIGNsYXNzPSJ0ZXh0LXdoaXRlIHRleHQtc20iPuKckzwvc3Bhbj4KICAgICAgICAgICAgICAgIDwvYnV0dG9uPgoKICAgICAgICAgICAgICAgIDwhLS0gQW56ZWlnZSAtLT4KICAgICAgICAgICAgICAgIDxzcGFuIHgtc2hvdz0iZWRpdGluZ0lkICE9PSBpdGVtLmlkIgogICAgICAgICAgICAgICAgICBAY2xpY2s9InN0YXJ0RWRpdChpdGVtKSIKICAgICAgICAgICAgICAgICAgY2xhc3M9ImZsZXgtMSB0ZXh0LVsxNXB4XSBjdXJzb3ItdGV4dCIKICAgICAgICAgICAgICAgICAgOmNsYXNzPSJpdGVtLmNvbXBsZXRlZCAmJiAnbGluZS10aHJvdWdoIHRleHQtc2xhdGUtNDAwJyIKICAgICAgICAgICAgICAgICAgeC10ZXh0PSJpdGVtLnRpdGxlIj48L3NwYW4+CiAgICAgICAgICAgICAgICA8YnV0dG9uIHgtc2hvdz0iZWRpdGluZ0lkICE9PSBpdGVtLmlkIiBAY2xpY2s9InJlbW92ZShpdGVtKSIgY2xhc3M9InNocmluay0wIHRleHQtc2xhdGUtMzAwIGhvdmVyOnRleHQtcm9zZS01MDAgdGV4dC1sZyBweC0xIj7DlzwvYnV0dG9uPgoKICAgICAgICAgICAgICAgIDwhLS0gQmVhcmJlaXRlbjogVGV4dCB1bXNjaHJlaWJlbiArIEthdGVnb3JpZSB3ZWNoc2VsbiAtLT4KICAgICAgICAgICAgICAgIDxkaXYgeC1zaG93PSJlZGl0aW5nSWQgPT09IGl0ZW0uaWQiIGNsYXNzPSJmbGV4LTEgZmxleCBmbGV4LWNvbCBnYXAtMSIgQGNsaWNrLnN0b3A+CiAgICAgICAgICAgICAgICAgIDxpbnB1dCB4LW1vZGVsPSJlZGl0VGV4dCIKICAgICAgICAgICAgICAgICAgICBAa2V5ZG93bi5lbnRlcj0ic2F2ZUVkaXQoaXRlbSkiIEBrZXlkb3duLmVzY2FwZT0iY2FuY2VsRWRpdCgpIgogICAgICAgICAgICAgICAgICAgIHgtcmVmPSJlZGl0IgogICAgICAgICAgICAgICAgICAgIGNsYXNzPSJ3LWZ1bGwgdGV4dC1bMTVweF0gYm9yZGVyIGJvcmRlci1lbWVyYWxkLTQwMCByb3VuZGVkIHB4LTIgcHktMSBmb2N1czpvdXRsaW5lLW5vbmUiPgogICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPSJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiI+CiAgICAgICAgICAgICAgICAgICAgPHNlbGVjdCB4LW1vZGVsPSJpdGVtLmNhdGVnb3J5IiBAY2hhbmdlPSJwZXJzaXN0KGl0ZW0pIgogICAgICAgICAgICAgICAgICAgICAgY2xhc3M9ImZsZXgtMSB0ZXh0LXNtIGJvcmRlciBib3JkZXItc2xhdGUtMzAwIHJvdW5kZWQgcHgtMiBweS0xIGJnLXdoaXRlIHRleHQtc2xhdGUtNjAwIj4KICAgICAgICAgICAgICAgICAgICAgIDx0ZW1wbGF0ZSB4LWZvcj0iYyBpbiBfY2F0ZWdvcmllcyIgOmtleT0iYyI+PG9wdGlvbiA6dmFsdWU9ImMiIHgtdGV4dD0iYyI+PC9vcHRpb24+PC90ZW1wbGF0ZT4KICAgICAgICAgICAgICAgICAgICA8L3NlbGVjdD4KICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIEBjbGljaz0ic2F2ZUVkaXQoaXRlbSkiIGNsYXNzPSJzaHJpbmstMCByb3VuZGVkIGJnLWVtZXJhbGQtNjAwIHRleHQtd2hpdGUgdGV4dC1zbSBweC0zIHB5LTEiPkZlcnRpZzwvYnV0dG9uPgogICAgICAgICAgICAgICAgICA8L2Rpdj4KICAgICAgICAgICAgICAgIDwvZGl2PgogICAgICAgICAgICAgIDwvZGl2PgogICAgICAgICAgICA8L3RlbXBsYXRlPgogICAgICAgICAgPC9kaXY+CiAgICAgICAgPC9zZWN0aW9uPgogICAgICA8L3RlbXBsYXRlPgoKICAgICAgPHAgeC1zaG93PSJpdGVtcy5sZW5ndGggPT09IDAgJiYgIWxvYWRpbmciIGNsYXNzPSJ0ZXh0LWNlbnRlciB0ZXh0LXNsYXRlLTQwMCBweS0xMCI+CiAgICAgICAgTm9jaCBuaWNodHMgZHJhdWYg4oCTIGbDvGdlIHVudGVuIGRlbiBlcnN0ZW4gUHVua3QgaGluenUuIPCfkYcKICAgICAgPC9wPgogICAgPC9kaXY+CgogICAgPCEtLSBFaW5nYWJlbGVpc3RlIHVudGVuIC0tPgogICAgPGZvcm0gQHN1Ym1pdC5wcmV2ZW50PSJzdWJtaXRBZGQoKSIKICAgICAgY2xhc3M9ImZpeGVkIGJvdHRvbS0wIGluc2V0LXgtMCBib3JkZXItdCBib3JkZXItc2xhdGUtMjAwIGJnLXdoaXRlLzk1IGJhY2tkcm9wLWJsdXIgcHgtNCBweS0zIj4KICAgICAgPGRpdiBjbGFzcz0ibWF4LXcteGwgbXgtYXV0byBmbGV4IGdhcC0yIj4KICAgICAgICA8c2VsZWN0IHgtbW9kZWw9Im5ld0NhdCIgY2xhc3M9InJvdW5kZWQteGwgYm9yZGVyIGJvcmRlci1zbGF0ZS0zMDAgYmctd2hpdGUgcHgtMiBweS0yIHRleHQtc20gdGV4dC1zbGF0ZS02MDAiPgogICAgICAgICAgPHRlbXBsYXRlIHgtZm9yPSJjIGluIF9jYXRlZ29yaWVzIiA6a2V5PSJjIj48b3B0aW9uIHgtdGV4dD0iYyIgOnZhbHVlPSJjIj48L29wdGlvbj48L3RlbXBsYXRlPgogICAgICAgIDwvc2VsZWN0PgogICAgICAgIDxpbnB1dCB4LW1vZGVsPSJuZXdUaXRsZSIgdHlwZT0idGV4dCIgcGxhY2Vob2xkZXI9IldhcyBub2NoIGVpbnBhY2tlbj8iIGVudGVya2V5aGludD0iZG9uZSIKICAgICAgICAgIGNsYXNzPSJmbGV4LTEgcm91bmRlZC14bCBib3JkZXIgYm9yZGVyLXNsYXRlLTMwMCBweC0zIHB5LTIgdGV4dC1bMTVweF0gZm9jdXM6b3V0bGluZS1ub25lIGZvY3VzOnJpbmctMiBmb2N1czpyaW5nLWVtZXJhbGQtNDAwIj4KICAgICAgICA8YnV0dG9uIHR5cGU9InN1Ym1pdCIgY2xhc3M9InJvdW5kZWQteGwgYmctZW1lcmFsZC02MDAgdGV4dC13aGl0ZSBweC00IHB5LTIgdGV4dC1sZyBmb250LW1lZGl1bSBhY3RpdmU6YmctZW1lcmFsZC03MDAiPis8L2J1dHRvbj4KICAgICAgPC9kaXY+CiAgICA8L2Zvcm0+CgogIDwvZGl2PgoKICA8c2NyaXB0IGlkPSJfX2RhdGEiIHR5cGU9ImFwcGxpY2F0aW9uL2pzb24iPl9fREFUQV9QTEFDRUhPTERFUl9fPC9zY3JpcHQ+CiAgPHNjcmlwdD4KICAgIGNvbnN0IENBVFMgPSBbJ0Rva3VtZW50ZScsICdLbGVpZHVuZycsICdTY2h1aGUnLCAnUmFuamEnLCAnVGFyZWsnLCAnT2xsaScsICdLdWx0dXJiZXV0ZWwnLCAnTWVkaWthbWVudGUnLCAnU3VwcGxlbWVudHMnLCAnVGVjaG5paycsICdTdHJhbmQgJiBXYXNzZXInLCAnU3BpZWxlJywgJ1ZvciBkZXIgQWJyZWlzZScsICdTb25zdGlnZXMnXTsKCiAgICBmdW5jdGlvbiBwYWNrbGlzdGUoKSB7CiAgICAgIHJldHVybiB7CiAgICAgICAgaXRlbXM6IFtdLAogICAgICAgIGxvYWRpbmc6IGZhbHNlLAogICAgICAgIGVkaXRpbmdJZDogbnVsbCwKICAgICAgICBlZGl0VGV4dDogJycsCiAgICAgICAgbmV3VGl0bGU6ICcnLAogICAgICAgIG5ld0NhdDogJ1NvbnN0aWdlcycsCiAgICAgICAgX2NhdGVnb3JpZXM6IENBVFMsCiAgICAgICAgY29sbGFwc2VkOiB7fSwKICAgICAgICBjYXRPcmRlcjogQ0FUUy5zbGljZSgpLAoKICAgICAgICBpbml0KCkgewogICAgICAgICAgdHJ5IHsKICAgICAgICAgICAgdGhpcy5pdGVtcyA9IEpTT04ucGFyc2UoYXRvYihkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnX19kYXRhJykudGV4dENvbnRlbnQpKSB8fCBbXTsKICAgICAgICAgIH0gY2F0Y2ggKGUpIHsgdGhpcy5pdGVtcyA9IFtdOyB9CiAgICAgICAgICAvLyBBbnNpY2h0LUVpbnN0ZWxsdW5nZW4gbG9rYWwgcHJvIEdlcsOkdCAobmljaHQgbWl0IGRlbSBhbmRlcmVuIGdldGVpbHQpCiAgICAgICAgICB0cnkgeyB0aGlzLmNvbGxhcHNlZCA9IEpTT04ucGFyc2UobG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3BsX2NvbGxhcHNlZCcpIHx8ICd7fScpIHx8IHt9OyB9IGNhdGNoIChlKSB7IHRoaXMuY29sbGFwc2VkID0ge307IH0KICAgICAgICAgIHRyeSB7CiAgICAgICAgICAgIGNvbnN0IHNhdmVkID0gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgncGxfY2F0T3JkZXInKSB8fCAnbnVsbCcpOwogICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShzYXZlZCkgJiYgc2F2ZWQubGVuZ3RoKSB7CiAgICAgICAgICAgICAgdGhpcy5jYXRPcmRlciA9IHNhdmVkLmNvbmNhdChDQVRTLmZpbHRlcihjID0+ICFzYXZlZC5pbmNsdWRlcyhjKSkpOwogICAgICAgICAgICB9CiAgICAgICAgICB9IGNhdGNoIChlKSB7fQogICAgICAgICAgLy8gQWxsZSB+OCBTZWsuIG5ldSBsYWRlbiwgZGFtaXQgaWhyIGJlaWRlIGRpZXNlbGJlbiBIw6RrY2hlbiBzZWh0CiAgICAgICAgICBzZXRJbnRlcnZhbCgoKSA9PiB0aGlzLmxvYWQoKSwgODAwMCk7CiAgICAgICAgfSwKICAgICAgICBjYXRlZ29yaWVzKCkgewogICAgICAgICAgY29uc3QgcHJlc2VudCA9IFsuLi5uZXcgU2V0KHRoaXMuaXRlbXMubWFwKGkgPT4gaS5jYXRlZ29yeSB8fCAnU29uc3RpZ2VzJykpXTsKICAgICAgICAgIGNvbnN0IG9yZGVyZWQgPSB0aGlzLmNhdE9yZGVyLmZpbHRlcihjID0+IHByZXNlbnQuaW5jbHVkZXMoYykpOwogICAgICAgICAgcmV0dXJuIG9yZGVyZWQuY29uY2F0KHByZXNlbnQuZmlsdGVyKGMgPT4gIXRoaXMuY2F0T3JkZXIuaW5jbHVkZXMoYykpKTsKICAgICAgICB9LAogICAgICAgIGl0ZW1zSW4oY2F0KSB7CiAgICAgICAgICByZXR1cm4gdGhpcy5pdGVtcy5maWx0ZXIoaSA9PiAoaS5jYXRlZ29yeSB8fCAnU29uc3RpZ2VzJykgPT09IGNhdCk7CiAgICAgICAgfSwKICAgICAgICBkb25lQ291bnQoY2F0KSB7CiAgICAgICAgICByZXR1cm4gdGhpcy5pdGVtc0luKGNhdCkuZmlsdGVyKGkgPT4gaS5jb21wbGV0ZWQpLmxlbmd0aDsKICAgICAgICB9LAogICAgICAgIHByb2dyZXNzKCkgewogICAgICAgICAgaWYgKCF0aGlzLml0ZW1zLmxlbmd0aCkgcmV0dXJuIDA7CiAgICAgICAgICByZXR1cm4gTWF0aC5yb3VuZCgxMDAgKiB0aGlzLml0ZW1zLmZpbHRlcihpID0+IGkuY29tcGxldGVkKS5sZW5ndGggLyB0aGlzLml0ZW1zLmxlbmd0aCk7CiAgICAgICAgfSwKICAgICAgICBzdGF0dXNUZXh0KCkgewogICAgICAgICAgY29uc3QgZG9uZSA9IHRoaXMuaXRlbXMuZmlsdGVyKGkgPT4gaS5jb21wbGV0ZWQpLmxlbmd0aDsKICAgICAgICAgIHJldHVybiBgJHtkb25lfSB2b24gJHt0aGlzLml0ZW1zLmxlbmd0aH0gZWluZ2VwYWNrdGA7CiAgICAgICAgfSwKCiAgICAgICAgLy8gQWJzY2huaXR0IGVpbi0vYXVza2xhcHBlbiAobG9rYWwgZ2VzcGVpY2hlcnQpCiAgICAgICAgdG9nZ2xlQ29sbGFwc2UoY2F0KSB7CiAgICAgICAgICB0aGlzLmNvbGxhcHNlZFtjYXRdID0gIXRoaXMuY29sbGFwc2VkW2NhdF07CiAgICAgICAgICB0cnkgeyBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgncGxfY29sbGFwc2VkJywgSlNPTi5zdHJpbmdpZnkodGhpcy5jb2xsYXBzZWQpKTsgfSBjYXRjaCAoZSkge30KICAgICAgICB9LAoKICAgICAgICAvLyBBYnNjaG5pdHQgaG9jaC9ydW50ZXIgdmVyc2NoaWViZW4gKFJlaWhlbmZvbGdlIGxva2FsIGdlc3BlaWNoZXJ0KQogICAgICAgIG1vdmVDYXQoY2F0LCBkaXIpIHsKICAgICAgICAgIGNvbnN0IHZpcyA9IHRoaXMuY2F0ZWdvcmllcygpOwogICAgICAgICAgY29uc3QgaSA9IHZpcy5pbmRleE9mKGNhdCk7CiAgICAgICAgICBjb25zdCBqID0gaSArIGRpcjsKICAgICAgICAgIGlmIChpIDwgMCB8fCBqIDwgMCB8fCBqID49IHZpcy5sZW5ndGgpIHJldHVybjsKICAgICAgICAgIHZpcy5zcGxpY2UoaSwgMSk7CiAgICAgICAgICB2aXMuc3BsaWNlKGosIDAsIGNhdCk7CiAgICAgICAgICB0aGlzLmNhdE9yZGVyID0gdmlzLmNvbmNhdCh0aGlzLmNhdE9yZGVyLmZpbHRlcihjID0+ICF2aXMuaW5jbHVkZXMoYykpKTsKICAgICAgICAgIHRyeSB7IGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdwbF9jYXRPcmRlcicsIEpTT04uc3RyaW5naWZ5KHRoaXMuY2F0T3JkZXIpKTsgfSBjYXRjaCAoZSkge30KICAgICAgICB9LAoKICAgICAgICBhc3luYyBsb2FkKCkgewogICAgICAgICAgaWYgKHRoaXMuZWRpdGluZ0lkICE9PSBudWxsKSByZXR1cm47IC8vIG5pY2h0IG1pdHRlbiBpbSBCZWFyYmVpdGVuIG5ldSBsYWRlbgogICAgICAgICAgdGhpcy5sb2FkaW5nID0gdHJ1ZTsKICAgICAgICAgIHRyeSB7CiAgICAgICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCcvd2ViaG9vay9wYWNrbGlzdGUvaXRlbXMnLCB7IGNhY2hlOiAnbm8tc3RvcmUnIH0pOwogICAgICAgICAgICBpZiAocmVzLm9rKSB0aGlzLml0ZW1zID0gYXdhaXQgcmVzLmpzb24oKTsKICAgICAgICAgIH0gY2F0Y2ggKGUpIHt9IGZpbmFsbHkgeyB0aGlzLmxvYWRpbmcgPSBmYWxzZTsgfQogICAgICAgIH0sCiAgICAgICAgYXN5bmMgdG9nZ2xlKGl0ZW0pIHsKICAgICAgICAgIGl0ZW0uY29tcGxldGVkID0gIWl0ZW0uY29tcGxldGVkOwogICAgICAgICAgdHJ5IHsKICAgICAgICAgICAgYXdhaXQgZmV0Y2goJy93ZWJob29rL3BhY2tsaXN0ZS90b2dnbGUnLCB7CiAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LAogICAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgaWQ6IGl0ZW0uaWQsIGNvbXBsZXRlZDogaXRlbS5jb21wbGV0ZWQgfSkKICAgICAgICAgICAgfSk7CiAgICAgICAgICB9IGNhdGNoIChlKSB7IGl0ZW0uY29tcGxldGVkID0gIWl0ZW0uY29tcGxldGVkOyB9CiAgICAgICAgfSwKCiAgICAgICAgLy8gQmVhcmJlaXRlbiBkZXMgVGV4dGVzCiAgICAgICAgc3RhcnRFZGl0KGl0ZW0pIHsKICAgICAgICAgIGlmICh0eXBlb2YgaXRlbS5pZCA9PT0gJ3N0cmluZycgJiYgaXRlbS5pZC5zdGFydHNXaXRoKCd0bXAtJykpIHJldHVybjsgLy8gZXJzdCBuYWNoIGRlbSBTcGVpY2hlcm4KICAgICAgICAgIHRoaXMuZWRpdGluZ0lkID0gaXRlbS5pZDsKICAgICAgICAgIHRoaXMuZWRpdFRleHQgPSBpdGVtLnRpdGxlOwogICAgICAgICAgdGhpcy4kbmV4dFRpY2soKCkgPT4geyBpZiAodGhpcy4kcmVmcy5lZGl0KSB7IHRoaXMuJHJlZnMuZWRpdC5mb2N1cygpOyB0aGlzLiRyZWZzLmVkaXQuc2VsZWN0KCk7IH0gfSk7CiAgICAgICAgfSwKICAgICAgICBjYW5jZWxFZGl0KCkgeyB0aGlzLmVkaXRpbmdJZCA9IG51bGw7IHRoaXMuZWRpdFRleHQgPSAnJzsgfSwKICAgICAgICBhc3luYyBzYXZlRWRpdChpdGVtKSB7CiAgICAgICAgICBpZiAodGhpcy5lZGl0aW5nSWQgIT09IGl0ZW0uaWQpIHJldHVybjsKICAgICAgICAgIGNvbnN0IHQgPSAodGhpcy5lZGl0VGV4dCB8fCAnJykudHJpbSgpOwogICAgICAgICAgdGhpcy5lZGl0aW5nSWQgPSBudWxsOwogICAgICAgICAgaWYgKHQgJiYgdCAhPT0gaXRlbS50aXRsZSkgewogICAgICAgICAgICBpdGVtLnRpdGxlID0gdDsKICAgICAgICAgICAgdGhpcy5wZXJzaXN0KGl0ZW0pOwogICAgICAgICAgfQogICAgICAgIH0sCgogICAgICAgIC8vIMOEbmRlcnVuZyAoVGl0ZWwgdW5kL29kZXIgS2F0ZWdvcmllKSBzcGVpY2hlcm4KICAgICAgICBhc3luYyBwZXJzaXN0KGl0ZW0pIHsKICAgICAgICAgIHRyeSB7CiAgICAgICAgICAgIGF3YWl0IGZldGNoKCcvd2ViaG9vay9wYWNrbGlzdGUvdXBkYXRlJywgewogICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLCBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSwKICAgICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGlkOiBpdGVtLmlkLCB0aXRsZTogaXRlbS50aXRsZSwgY2F0ZWdvcnk6IGl0ZW0uY2F0ZWdvcnkgfSkKICAgICAgICAgICAgfSk7CiAgICAgICAgICB9IGNhdGNoIChlKSB7fQogICAgICAgIH0sCgogICAgICAgIGFzeW5jIHN1Ym1pdEFkZCgpIHsKICAgICAgICAgIGNvbnN0IHRpdGxlID0gKHRoaXMubmV3VGl0bGUgfHwgJycpLnRyaW0oKTsKICAgICAgICAgIGlmICghdGl0bGUpIHJldHVybjsKICAgICAgICAgIGNvbnN0IGNhdGVnb3J5ID0gdGhpcy5uZXdDYXQgfHwgJ1NvbnN0aWdlcyc7CiAgICAgICAgICB0aGlzLm5ld1RpdGxlID0gJyc7CiAgICAgICAgICBjb25zdCBvcHRpbWlzdGljID0geyBpZDogJ3RtcC0nICsgRGF0ZS5ub3coKSwgdGl0bGU6IHRpdGxlLCBjYXRlZ29yeTogY2F0ZWdvcnksIGNvbXBsZXRlZDogZmFsc2UgfTsKICAgICAgICAgIHRoaXMuaXRlbXMucHVzaChvcHRpbWlzdGljKTsKICAgICAgICAgIHRyeSB7CiAgICAgICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCcvd2ViaG9vay9wYWNrbGlzdGUvYWRkJywgewogICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLCBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSwKICAgICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHRpdGxlOiB0aXRsZSwgY2F0ZWdvcnk6IGNhdGVnb3J5IH0pCiAgICAgICAgICAgIH0pOwogICAgICAgICAgICBpZiAocmVzLm9rKSB7CiAgICAgICAgICAgICAgY29uc3QgY3JlYXRlZCA9IGF3YWl0IHJlcy5qc29uKCk7CiAgICAgICAgICAgICAgY29uc3Qgcm93ID0gQXJyYXkuaXNBcnJheShjcmVhdGVkKSA/IGNyZWF0ZWRbMF0gOiBjcmVhdGVkOwogICAgICAgICAgICAgIGlmIChyb3cgJiYgcm93LmlkKSBPYmplY3QuYXNzaWduKG9wdGltaXN0aWMsIHJvdyk7CiAgICAgICAgICAgIH0KICAgICAgICAgIH0gY2F0Y2ggKGUpIHt9CiAgICAgICAgfSwKICAgICAgICBhc3luYyByZW1vdmUoaXRlbSkgewogICAgICAgICAgdGhpcy5pdGVtcyA9IHRoaXMuaXRlbXMuZmlsdGVyKGkgPT4gaS5pZCAhPT0gaXRlbS5pZCk7CiAgICAgICAgICB0cnkgewogICAgICAgICAgICBhd2FpdCBmZXRjaCgnL3dlYmhvb2svcGFja2xpc3RlL2RlbGV0ZScsIHsKICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJywgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sCiAgICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBpZDogaXRlbS5pZCB9KQogICAgICAgICAgICB9KTsKICAgICAgICAgIH0gY2F0Y2ggKGUpIHt9CiAgICAgICAgfQogICAgICB9OwogICAgfQogIDwvc2NyaXB0Pgo8L2JvZHk+CjwvaHRtbD4K';
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
