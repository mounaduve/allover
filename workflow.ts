import { workflow, node, trigger, expr } from '@n8n/workflow-sdk';

const HTML_B64 = 'PCFET0NUWVBFIGh0bWw+CjxodG1sIGxhbmc9ImRlIj4KPGhlYWQ+CiAgPG1ldGEgY2hhcnNldD0iVVRGLTgiPgogIDxtZXRhIG5hbWU9InZpZXdwb3J0IiBjb250ZW50PSJ3aWR0aD1kZXZpY2Utd2lkdGgsIGluaXRpYWwtc2NhbGU9MS4wIj4KICA8dGl0bGU+VXJsYXVic3BhY2tsaXN0ZTwvdGl0bGU+CiAgPHNjcmlwdCBzcmM9Imh0dHBzOi8vY2RuLnRhaWx3aW5kY3NzLmNvbSI+PC9zY3JpcHQ+CiAgPHNjcmlwdCBkZWZlciBzcmM9Imh0dHBzOi8vY2RuLmpzZGVsaXZyLm5ldC9ucG0vYWxwaW5lanNAMy9kaXN0L2Nkbi5taW4uanMiPjwvc2NyaXB0PgogIDxzdHlsZT4KICAgIFt4LWNsb2FrXSB7IGRpc3BsYXk6IG5vbmUgIWltcG9ydGFudDsgfQogICAgYm9keSB7IC13ZWJraXQtdGFwLWhpZ2hsaWdodC1jb2xvcjogdHJhbnNwYXJlbnQ7IH0KICA8L3N0eWxlPgo8L2hlYWQ+Cjxib2R5IGNsYXNzPSJiZy1zbGF0ZS0xMDAgbWluLWgtc2NyZWVuIHRleHQtc2xhdGUtODAwIj4KICA8ZGl2IHgtZGF0YT0icGFja2xpc3RlKCkiIHgtaW5pdD0iaW5pdCgpIiB4LWNsb2FrPgoKICAgIDxkaXYgY2xhc3M9Im1heC13LXhsIG14LWF1dG8gcHgtNCBweS02IHBiLTMyIj4KICAgICAgPCEtLSBLb3BmIC0tPgogICAgICA8aGVhZGVyIGNsYXNzPSJtYi00Ij4KICAgICAgICA8ZGl2IGNsYXNzPSJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4iPgogICAgICAgICAgPGgxIGNsYXNzPSJ0ZXh0LTJ4bCBmb250LWJvbGQgdGV4dC1zbGF0ZS05MDAiPvCfp7MgVXJsYXVic3BhY2tsaXN0ZTwvaDE+CiAgICAgICAgICA8YnV0dG9uIEBjbGljaz0ibG9hZCgpIiA6Y2xhc3M9ImxvYWRpbmcgJiYgJ2FuaW1hdGUtc3BpbiciIGNsYXNzPSJ0ZXh0LXNsYXRlLTQwMCB0ZXh0LXhsIiB0aXRsZT0iQWt0dWFsaXNpZXJlbiI+4p+zPC9idXR0b24+CiAgICAgICAgPC9kaXY+CiAgICAgICAgPHAgY2xhc3M9InRleHQtc20gdGV4dC1zbGF0ZS01MDAgbXQtMSIgeC10ZXh0PSJzdGF0dXNUZXh0KCkiPjwvcD4KICAgICAgICA8ZGl2IGNsYXNzPSJtdC0zIGgtMiB3LWZ1bGwgcm91bmRlZC1mdWxsIGJnLXNsYXRlLTIwMCBvdmVyZmxvdy1oaWRkZW4iPgogICAgICAgICAgPGRpdiBjbGFzcz0iaC1mdWxsIGJnLWVtZXJhbGQtNTAwIHRyYW5zaXRpb24tYWxsIGR1cmF0aW9uLTMwMCIgOnN0eWxlPSJgd2lkdGg6ICR7cHJvZ3Jlc3MoKX0lYCI+PC9kaXY+CiAgICAgICAgPC9kaXY+CiAgICAgICAgPHAgY2xhc3M9InRleHQtWzExcHhdIHRleHQtc2xhdGUtNDAwIG10LTIiPlRpcHA6IGF1ZiBkaWUgw5xiZXJzY2hyaWZ0IHRpcHBlbiA9IGVpbi0vYXVza2xhcHBlbiDCtyBtaXQg4pay4pa8IGRpZSBSdWJyaWsgdmVyc2NoaWViZW4gwrcgYXVmIGRlbiBUZXh0IHRpcHBlbiA9IHVtYmVuZW5uZW4gJmFtcDsgUnVicmlrIHdlY2hzZWxuLjwvcD4KICAgICAgPC9oZWFkZXI+CgogICAgICA8IS0tIExpc3RlIG5hY2ggS2F0ZWdvcmllIC0tPgogICAgICA8dGVtcGxhdGUgeC1mb3I9ImNhdCBpbiBjYXRlZ29yaWVzKCkiIDprZXk9ImNhdCI+CiAgICAgICAgPHNlY3Rpb24gY2xhc3M9Im1iLTQiPgogICAgICAgICAgPGgyIGNsYXNzPSJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBtYi0yIHB4LTEiPgogICAgICAgICAgICA8c3BhbiBAY2xpY2s9InRvZ2dsZUNvbGxhcHNlKGNhdCkiIGNsYXNzPSJmbGV4LTEgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgY3Vyc29yLXBvaW50ZXIgc2VsZWN0LW5vbmUiPgogICAgICAgICAgICAgIDxzcGFuIGNsYXNzPSJ3LTMgdGV4dC1zbGF0ZS00MDAgdGV4dC14cyIgeC10ZXh0PSJjb2xsYXBzZWRbY2F0XSA/ICfilrgnIDogJ+KWviciPjwvc3Bhbj4KICAgICAgICAgICAgICA8c3BhbiBjbGFzcz0idGV4dC14cyBmb250LXNlbWlib2xkIHVwcGVyY2FzZSB0cmFja2luZy13aWRlIHRleHQtc2xhdGUtNTAwIiB4LXRleHQ9ImNhdCI+PC9zcGFuPgogICAgICAgICAgICAgIDxzcGFuIGNsYXNzPSJ0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTQwMCIgeC10ZXh0PSJkb25lQ291bnQoY2F0KSArICcvJyArIGl0ZW1zSW4oY2F0KS5sZW5ndGgiPjwvc3Bhbj4KICAgICAgICAgICAgPC9zcGFuPgogICAgICAgICAgICA8YnV0dG9uIEBjbGljaz0icmVuYW1lQ2F0KGNhdCkiIGNsYXNzPSJ0ZXh0LXNsYXRlLTQwMCBob3Zlcjp0ZXh0LXNsYXRlLTYwMCB0ZXh0LXNtIHB4LTEgbGVhZGluZy1ub25lIiB0aXRsZT0iUnVicmlrIHVtYmVuZW5uZW4iPuKcjjwvYnV0dG9uPgogICAgICAgICAgICA8YnV0dG9uIEBjbGljaz0ibW92ZUNhdChjYXQsIC0xKSIgY2xhc3M9InRleHQtc2xhdGUtNDAwIGhvdmVyOnRleHQtc2xhdGUtNjAwIHRleHQtc20gcHgtMSBsZWFkaW5nLW5vbmUiIHRpdGxlPSJuYWNoIG9iZW4iPuKWsjwvYnV0dG9uPgogICAgICAgICAgICA8YnV0dG9uIEBjbGljaz0ibW92ZUNhdChjYXQsIDEpIiBjbGFzcz0idGV4dC1zbGF0ZS00MDAgaG92ZXI6dGV4dC1zbGF0ZS02MDAgdGV4dC1zbSBweC0xIGxlYWRpbmctbm9uZSIgdGl0bGU9Im5hY2ggdW50ZW4iPuKWvDwvYnV0dG9uPgogICAgICAgICAgPC9oMj4KICAgICAgICAgIDxkaXYgeC1zaG93PSIhY29sbGFwc2VkW2NhdF0iIGNsYXNzPSJiZy13aGl0ZSByb3VuZGVkLTJ4bCBzaGFkb3ctc20gZGl2aWRlLXkgZGl2aWRlLXNsYXRlLTEwMCBvdmVyZmxvdy1oaWRkZW4iPgogICAgICAgICAgICA8dGVtcGxhdGUgeC1mb3I9Iml0ZW0gaW4gaXRlbXNJbihjYXQpIiA6a2V5PSJpdGVtLmlkIj4KICAgICAgICAgICAgICA8ZGl2IGNsYXNzPSJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBweC0zIHB5LTMgYWN0aXZlOmJnLXNsYXRlLTUwIj4KICAgICAgICAgICAgICAgIDxidXR0b24geC1zaG93PSJlZGl0aW5nSWQgIT09IGl0ZW0uaWQiIEBjbGljaz0idG9nZ2xlKGl0ZW0pIgogICAgICAgICAgICAgICAgICA6Y2xhc3M9Iml0ZW0uY29tcGxldGVkID8gJ2JnLWVtZXJhbGQtNTAwIGJvcmRlci1lbWVyYWxkLTUwMCcgOiAnYm9yZGVyLXNsYXRlLTMwMCciCiAgICAgICAgICAgICAgICAgIGNsYXNzPSJzaHJpbmstMCB3LTYgaC02IHJvdW5kZWQtZnVsbCBib3JkZXItMiBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciB0cmFuc2l0aW9uLWNvbG9ycyI+CiAgICAgICAgICAgICAgICAgIDxzcGFuIHgtc2hvdz0iaXRlbS5jb21wbGV0ZWQiIGNsYXNzPSJ0ZXh0LXdoaXRlIHRleHQtc20iPuKckzwvc3Bhbj4KICAgICAgICAgICAgICAgIDwvYnV0dG9uPgoKICAgICAgICAgICAgICAgIDwhLS0gQW56ZWlnZSAtLT4KICAgICAgICAgICAgICAgIDxzcGFuIHgtc2hvdz0iZWRpdGluZ0lkICE9PSBpdGVtLmlkIgogICAgICAgICAgICAgICAgICBAY2xpY2s9InN0YXJ0RWRpdChpdGVtKSIKICAgICAgICAgICAgICAgICAgY2xhc3M9ImZsZXgtMSB0ZXh0LVsxNXB4XSBjdXJzb3ItdGV4dCIKICAgICAgICAgICAgICAgICAgOmNsYXNzPSJpdGVtLmNvbXBsZXRlZCAmJiAnbGluZS10aHJvdWdoIHRleHQtc2xhdGUtNDAwJyIKICAgICAgICAgICAgICAgICAgeC10ZXh0PSJpdGVtLnRpdGxlIj48L3NwYW4+CiAgICAgICAgICAgICAgICA8YnV0dG9uIHgtc2hvdz0iZWRpdGluZ0lkICE9PSBpdGVtLmlkIiBAY2xpY2s9InJlbW92ZShpdGVtKSIgY2xhc3M9InNocmluay0wIHRleHQtc2xhdGUtMzAwIGhvdmVyOnRleHQtcm9zZS01MDAgdGV4dC1sZyBweC0xIj7DlzwvYnV0dG9uPgoKICAgICAgICAgICAgICAgIDwhLS0gQmVhcmJlaXRlbjogVGV4dCB1bXNjaHJlaWJlbiArIEthdGVnb3JpZSB3ZWNoc2VsbiAtLT4KICAgICAgICAgICAgICAgIDxkaXYgeC1zaG93PSJlZGl0aW5nSWQgPT09IGl0ZW0uaWQiIGNsYXNzPSJmbGV4LTEgZmxleCBmbGV4LWNvbCBnYXAtMSIgQGNsaWNrLnN0b3A+CiAgICAgICAgICAgICAgICAgIDxpbnB1dCB4LW1vZGVsPSJlZGl0VGV4dCIKICAgICAgICAgICAgICAgICAgICBAa2V5ZG93bi5lbnRlcj0ic2F2ZUVkaXQoaXRlbSkiIEBrZXlkb3duLmVzY2FwZT0iY2FuY2VsRWRpdCgpIgogICAgICAgICAgICAgICAgICAgIHgtcmVmPSJlZGl0IgogICAgICAgICAgICAgICAgICAgIGNsYXNzPSJ3LWZ1bGwgdGV4dC1bMTVweF0gYm9yZGVyIGJvcmRlci1lbWVyYWxkLTQwMCByb3VuZGVkIHB4LTIgcHktMSBmb2N1czpvdXRsaW5lLW5vbmUiPgogICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPSJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiI+CiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9InRleHQteHMgdGV4dC1zbGF0ZS00MDAgc2hyaW5rLTAiPlJ1YnJpazo8L3NwYW4+CiAgICAgICAgICAgICAgICAgICAgPHNlbGVjdCB4LW1vZGVsPSJpdGVtLmNhdGVnb3J5IiBAY2hhbmdlPSJvbkl0ZW1DYXRDaGFuZ2UoaXRlbSkiCiAgICAgICAgICAgICAgICAgICAgICBjbGFzcz0iZmxleC0xIHRleHQtc20gYm9yZGVyIGJvcmRlci1zbGF0ZS0zMDAgcm91bmRlZCBweC0yIHB5LTEgYmctd2hpdGUgdGV4dC1zbGF0ZS02MDAiPgogICAgICAgICAgICAgICAgICAgICAgPHRlbXBsYXRlIHgtZm9yPSJjIGluIGFsbENhdGVnb3JpZXMoKSIgOmtleT0iYyI+PG9wdGlvbiA6dmFsdWU9ImMiIHgtdGV4dD0iYyI+PC9vcHRpb24+PC90ZW1wbGF0ZT4KICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9Il9fbmV3X18iPuKelSBOZXVlIFJ1YnJpa+KApjwvb3B0aW9uPgogICAgICAgICAgICAgICAgICAgIDwvc2VsZWN0PgogICAgICAgICAgICAgICAgICAgIDxidXR0b24gQGNsaWNrPSJzYXZlRWRpdChpdGVtKSIgY2xhc3M9InNocmluay0wIHJvdW5kZWQgYmctZW1lcmFsZC02MDAgdGV4dC13aGl0ZSB0ZXh0LXNtIHB4LTMgcHktMSI+RmVydGlnPC9idXR0b24+CiAgICAgICAgICAgICAgICAgIDwvZGl2PgogICAgICAgICAgICAgICAgPC9kaXY+CiAgICAgICAgICAgICAgPC9kaXY+CiAgICAgICAgICAgIDwvdGVtcGxhdGU+CiAgICAgICAgICA8L2Rpdj4KICAgICAgICA8L3NlY3Rpb24+CiAgICAgIDwvdGVtcGxhdGU+CgogICAgICA8cCB4LXNob3c9Iml0ZW1zLmxlbmd0aCA9PT0gMCAmJiAhbG9hZGluZyIgY2xhc3M9InRleHQtY2VudGVyIHRleHQtc2xhdGUtNDAwIHB5LTEwIj4KICAgICAgICBOb2NoIG5pY2h0cyBkcmF1ZiDigJMgZsO8Z2UgdW50ZW4gZGVuIGVyc3RlbiBQdW5rdCBoaW56dS4g8J+RhwogICAgICA8L3A+CiAgICA8L2Rpdj4KCiAgICA8IS0tIEVpbmdhYmVsZWlzdGUgdW50ZW4gLS0+CiAgICA8Zm9ybSBAc3VibWl0LnByZXZlbnQ9InN1Ym1pdEFkZCgpIgogICAgICBjbGFzcz0iZml4ZWQgYm90dG9tLTAgaW5zZXQteC0wIGJvcmRlci10IGJvcmRlci1zbGF0ZS0yMDAgYmctd2hpdGUvOTUgYmFja2Ryb3AtYmx1ciBweC00IHB5LTMiPgogICAgICA8ZGl2IGNsYXNzPSJtYXgtdy14bCBteC1hdXRvIGZsZXggZ2FwLTIiPgogICAgICAgIDxzZWxlY3QgeC1tb2RlbD0ibmV3Q2F0IiBAY2hhbmdlPSJvbk5ld0NhdENoYW5nZSgpIiBjbGFzcz0icm91bmRlZC14bCBib3JkZXIgYm9yZGVyLXNsYXRlLTMwMCBiZy13aGl0ZSBweC0yIHB5LTIgdGV4dC1zbSB0ZXh0LXNsYXRlLTYwMCI+CiAgICAgICAgICA8dGVtcGxhdGUgeC1mb3I9ImMgaW4gYWxsQ2F0ZWdvcmllcygpIiA6a2V5PSJjIj48b3B0aW9uIHgtdGV4dD0iYyIgOnZhbHVlPSJjIj48L29wdGlvbj48L3RlbXBsYXRlPgogICAgICAgICAgPG9wdGlvbiB2YWx1ZT0iX19uZXdfXyI+4p6VIE5ldWUgUnVicmlr4oCmPC9vcHRpb24+CiAgICAgICAgPC9zZWxlY3Q+CiAgICAgICAgPGlucHV0IHgtbW9kZWw9Im5ld1RpdGxlIiB0eXBlPSJ0ZXh0IiBwbGFjZWhvbGRlcj0iV2FzIG5vY2ggZWlucGFja2VuPyIgZW50ZXJrZXloaW50PSJkb25lIgogICAgICAgICAgY2xhc3M9ImZsZXgtMSByb3VuZGVkLXhsIGJvcmRlciBib3JkZXItc2xhdGUtMzAwIHB4LTMgcHktMiB0ZXh0LVsxNXB4XSBmb2N1czpvdXRsaW5lLW5vbmUgZm9jdXM6cmluZy0yIGZvY3VzOnJpbmctZW1lcmFsZC00MDAiPgogICAgICAgIDxidXR0b24gdHlwZT0ic3VibWl0IiBjbGFzcz0icm91bmRlZC14bCBiZy1lbWVyYWxkLTYwMCB0ZXh0LXdoaXRlIHB4LTQgcHktMiB0ZXh0LWxnIGZvbnQtbWVkaXVtIGFjdGl2ZTpiZy1lbWVyYWxkLTcwMCI+KzwvYnV0dG9uPgogICAgICA8L2Rpdj4KICAgIDwvZm9ybT4KCiAgPC9kaXY+CgogIDxzY3JpcHQgaWQ9Il9fZGF0YSIgdHlwZT0iYXBwbGljYXRpb24vanNvbiI+X19EQVRBX1BMQUNFSE9MREVSX188L3NjcmlwdD4KICA8c2NyaXB0PgogICAgY29uc3QgQ0FUUyA9IFsnRG9rdW1lbnRlJywgJ0tsZWlkdW5nJywgJ1NjaHVoZScsICdSYW5qYScsICdUYXJlaycsICdPbGxpJywgJ0t1bHR1cmJldXRlbCcsICdNZWRpa2FtZW50ZScsICdTdXBwbGVtZW50cycsICdUZWNobmlrJywgJ1N0cmFuZCAmIFdhc3NlcicsICdTcGllbGUnLCAnVm9yIGRlciBBYnJlaXNlJywgJ1NvbnN0aWdlcyddOwoKICAgIGZ1bmN0aW9uIHBhY2tsaXN0ZSgpIHsKICAgICAgcmV0dXJuIHsKICAgICAgICBpdGVtczogW10sCiAgICAgICAgbG9hZGluZzogZmFsc2UsCiAgICAgICAgZWRpdGluZ0lkOiBudWxsLAogICAgICAgIGVkaXRUZXh0OiAnJywKICAgICAgICBlZGl0Q2F0QmVmb3JlOiAnJywKICAgICAgICBuZXdUaXRsZTogJycsCiAgICAgICAgbmV3Q2F0OiAnU29uc3RpZ2VzJywKICAgICAgICBfY2F0ZWdvcmllczogQ0FUUywKICAgICAgICBjb2xsYXBzZWQ6IHt9LAogICAgICAgIGNhdE9yZGVyOiBDQVRTLnNsaWNlKCksCgogICAgICAgIGluaXQoKSB7CiAgICAgICAgICB0cnkgewogICAgICAgICAgICB0aGlzLml0ZW1zID0gSlNPTi5wYXJzZShhdG9iKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdfX2RhdGEnKS50ZXh0Q29udGVudCkpIHx8IFtdOwogICAgICAgICAgfSBjYXRjaCAoZSkgeyB0aGlzLml0ZW1zID0gW107IH0KICAgICAgICAgIC8vIEFuc2ljaHQtRWluc3RlbGx1bmdlbiBsb2thbCBwcm8gR2Vyw6R0IChuaWNodCBtaXQgZGVtIGFuZGVyZW4gZ2V0ZWlsdCkKICAgICAgICAgIHRyeSB7IHRoaXMuY29sbGFwc2VkID0gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgncGxfY29sbGFwc2VkJykgfHwgJ3t9JykgfHwge307IH0gY2F0Y2ggKGUpIHsgdGhpcy5jb2xsYXBzZWQgPSB7fTsgfQogICAgICAgICAgdHJ5IHsKICAgICAgICAgICAgY29uc3Qgc2F2ZWQgPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdwbF9jYXRPcmRlcicpIHx8ICdudWxsJyk7CiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHNhdmVkKSAmJiBzYXZlZC5sZW5ndGgpIHsKICAgICAgICAgICAgICB0aGlzLmNhdE9yZGVyID0gc2F2ZWQuY29uY2F0KENBVFMuZmlsdGVyKGMgPT4gIXNhdmVkLmluY2x1ZGVzKGMpKSk7CiAgICAgICAgICAgIH0KICAgICAgICAgIH0gY2F0Y2ggKGUpIHt9CiAgICAgICAgICAvLyBBbGxlIH44IFNlay4gbmV1IGxhZGVuLCBkYW1pdCBpaHIgYmVpZGUgZGllc2VsYmVuIEjDpGtjaGVuIHNlaHQKICAgICAgICAgIHNldEludGVydmFsKCgpID0+IHRoaXMubG9hZCgpLCA4MDAwKTsKICAgICAgICB9LAogICAgICAgIGNhdGVnb3JpZXMoKSB7CiAgICAgICAgICBjb25zdCBwcmVzZW50ID0gWy4uLm5ldyBTZXQodGhpcy5pdGVtcy5tYXAoaSA9PiBpLmNhdGVnb3J5IHx8ICdTb25zdGlnZXMnKSldOwogICAgICAgICAgY29uc3Qgb3JkZXJlZCA9IHRoaXMuY2F0T3JkZXIuZmlsdGVyKGMgPT4gcHJlc2VudC5pbmNsdWRlcyhjKSk7CiAgICAgICAgICByZXR1cm4gb3JkZXJlZC5jb25jYXQocHJlc2VudC5maWx0ZXIoYyA9PiAhdGhpcy5jYXRPcmRlci5pbmNsdWRlcyhjKSkpOwogICAgICAgIH0sCiAgICAgICAgaXRlbXNJbihjYXQpIHsKICAgICAgICAgIHJldHVybiB0aGlzLml0ZW1zLmZpbHRlcihpID0+IChpLmNhdGVnb3J5IHx8ICdTb25zdGlnZXMnKSA9PT0gY2F0KTsKICAgICAgICB9LAogICAgICAgIGRvbmVDb3VudChjYXQpIHsKICAgICAgICAgIHJldHVybiB0aGlzLml0ZW1zSW4oY2F0KS5maWx0ZXIoaSA9PiBpLmNvbXBsZXRlZCkubGVuZ3RoOwogICAgICAgIH0sCiAgICAgICAgLy8gYWxsZSB3w6RobGJhcmVuIFJ1YnJpa2VuIChTdGFuZGFyZCArIHZvcmhhbmRlbmUgKyB1bWJlbmFubnRlKQogICAgICAgIGFsbENhdGVnb3JpZXMoKSB7CiAgICAgICAgICBjb25zdCBvdXQgPSBbXTsKICAgICAgICAgIHRoaXMuY2F0T3JkZXIuZm9yRWFjaChjID0+IHsgaWYgKCFvdXQuaW5jbHVkZXMoYykpIG91dC5wdXNoKGMpOyB9KTsKICAgICAgICAgIHRoaXMuaXRlbXMuZm9yRWFjaChpID0+IHsgY29uc3QgYyA9IGkuY2F0ZWdvcnkgfHwgJ1NvbnN0aWdlcyc7IGlmICghb3V0LmluY2x1ZGVzKGMpKSBvdXQucHVzaChjKTsgfSk7CiAgICAgICAgICByZXR1cm4gb3V0OwogICAgICAgIH0sCiAgICAgICAgLy8gTmV1ZSBSdWJyaWsgYW5sZWdlbiAoZnJhZ3QgbmFjaCBkZW0gTmFtZW4sIG1lcmt0IHNpZSBzaWNoIGxva2FsKQogICAgICAgIG5ld0NhdGVnb3J5KCkgewogICAgICAgICAgY29uc3QgbmFtZSA9ICh3aW5kb3cucHJvbXB0KCdOZXVlIFJ1YnJpayBhbmxlZ2VuOicpIHx8ICcnKS50cmltKCk7CiAgICAgICAgICBpZiAoIW5hbWUgfHwgbmFtZSA9PT0gJ19fbmV3X18nKSByZXR1cm4gbnVsbDsKICAgICAgICAgIGlmICghdGhpcy5jYXRPcmRlci5pbmNsdWRlcyhuYW1lKSkgewogICAgICAgICAgICB0aGlzLmNhdE9yZGVyLnB1c2gobmFtZSk7CiAgICAgICAgICAgIHRyeSB7IGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdwbF9jYXRPcmRlcicsIEpTT04uc3RyaW5naWZ5KHRoaXMuY2F0T3JkZXIpKTsgfSBjYXRjaCAoZSkge30KICAgICAgICAgIH0KICAgICAgICAgIHJldHVybiBuYW1lOwogICAgICAgIH0sCiAgICAgICAgLy8gQXVzd2FobCAi4p6VIE5ldWUgUnVicmlr4oCmIiBpbiBkZXIgRWluZ2FiZWxlaXN0ZQogICAgICAgIG9uTmV3Q2F0Q2hhbmdlKCkgewogICAgICAgICAgaWYgKHRoaXMubmV3Q2F0ID09PSAnX19uZXdfXycpIHsKICAgICAgICAgICAgdGhpcy5uZXdDYXQgPSB0aGlzLm5ld0NhdGVnb3J5KCkgfHwgJ1NvbnN0aWdlcyc7CiAgICAgICAgICB9CiAgICAgICAgfSwKICAgICAgICAvLyBBdXN3YWhsICLinpUgTmV1ZSBSdWJyaWvigKYiIGltIEJlYXJiZWl0ZW4tRmVsZCBlaW5lcyBFaW50cmFncwogICAgICAgIG9uSXRlbUNhdENoYW5nZShpdGVtKSB7CiAgICAgICAgICBpZiAoaXRlbS5jYXRlZ29yeSA9PT0gJ19fbmV3X18nKSB7CiAgICAgICAgICAgIGl0ZW0uY2F0ZWdvcnkgPSB0aGlzLm5ld0NhdGVnb3J5KCkgfHwgdGhpcy5lZGl0Q2F0QmVmb3JlIHx8ICdTb25zdGlnZXMnOwogICAgICAgICAgfQogICAgICAgICAgdGhpcy5lZGl0Q2F0QmVmb3JlID0gaXRlbS5jYXRlZ29yeTsKICAgICAgICAgIHRoaXMucGVyc2lzdChpdGVtKTsKICAgICAgICB9LAogICAgICAgIC8vIFJ1YnJpayB1bWJlbmVubmVuIChhbGxlIEVpbnRyw6RnZSBkZXIgUnVicmlrIHdhbmRlcm4gbWl0KQogICAgICAgIHJlbmFtZUNhdChjYXQpIHsKICAgICAgICAgIGNvbnN0IG5hbWUgPSAod2luZG93LnByb21wdCgnUnVicmlrIHVtYmVuZW5uZW46JywgY2F0KSB8fCAnJykudHJpbSgpOwogICAgICAgICAgaWYgKCFuYW1lIHx8IG5hbWUgPT09IGNhdCkgcmV0dXJuOwogICAgICAgICAgdGhpcy5pdGVtcy5mb3JFYWNoKGl0ID0+IHsKICAgICAgICAgICAgaWYgKChpdC5jYXRlZ29yeSB8fCAnU29uc3RpZ2VzJykgPT09IGNhdCkgeyBpdC5jYXRlZ29yeSA9IG5hbWU7IHRoaXMucGVyc2lzdChpdCk7IH0KICAgICAgICAgIH0pOwogICAgICAgICAgdGhpcy5jYXRPcmRlciA9IHRoaXMuY2F0T3JkZXIubWFwKGMgPT4gYyA9PT0gY2F0ID8gbmFtZSA6IGMpOwogICAgICAgICAgaWYgKCF0aGlzLmNhdE9yZGVyLmluY2x1ZGVzKG5hbWUpKSB0aGlzLmNhdE9yZGVyLnB1c2gobmFtZSk7CiAgICAgICAgICBpZiAoY2F0IGluIHRoaXMuY29sbGFwc2VkKSB7IHRoaXMuY29sbGFwc2VkW25hbWVdID0gdGhpcy5jb2xsYXBzZWRbY2F0XTsgZGVsZXRlIHRoaXMuY29sbGFwc2VkW2NhdF07IH0KICAgICAgICAgIGlmICh0aGlzLm5ld0NhdCA9PT0gY2F0KSB0aGlzLm5ld0NhdCA9IG5hbWU7CiAgICAgICAgICB0cnkgewogICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgncGxfY2F0T3JkZXInLCBKU09OLnN0cmluZ2lmeSh0aGlzLmNhdE9yZGVyKSk7CiAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdwbF9jb2xsYXBzZWQnLCBKU09OLnN0cmluZ2lmeSh0aGlzLmNvbGxhcHNlZCkpOwogICAgICAgICAgfSBjYXRjaCAoZSkge30KICAgICAgICB9LAogICAgICAgIHByb2dyZXNzKCkgewogICAgICAgICAgaWYgKCF0aGlzLml0ZW1zLmxlbmd0aCkgcmV0dXJuIDA7CiAgICAgICAgICByZXR1cm4gTWF0aC5yb3VuZCgxMDAgKiB0aGlzLml0ZW1zLmZpbHRlcihpID0+IGkuY29tcGxldGVkKS5sZW5ndGggLyB0aGlzLml0ZW1zLmxlbmd0aCk7CiAgICAgICAgfSwKICAgICAgICBzdGF0dXNUZXh0KCkgewogICAgICAgICAgY29uc3QgZG9uZSA9IHRoaXMuaXRlbXMuZmlsdGVyKGkgPT4gaS5jb21wbGV0ZWQpLmxlbmd0aDsKICAgICAgICAgIHJldHVybiBgJHtkb25lfSB2b24gJHt0aGlzLml0ZW1zLmxlbmd0aH0gZWluZ2VwYWNrdGA7CiAgICAgICAgfSwKCiAgICAgICAgLy8gQWJzY2huaXR0IGVpbi0vYXVza2xhcHBlbiAobG9rYWwgZ2VzcGVpY2hlcnQpCiAgICAgICAgdG9nZ2xlQ29sbGFwc2UoY2F0KSB7CiAgICAgICAgICB0aGlzLmNvbGxhcHNlZFtjYXRdID0gIXRoaXMuY29sbGFwc2VkW2NhdF07CiAgICAgICAgICB0cnkgeyBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgncGxfY29sbGFwc2VkJywgSlNPTi5zdHJpbmdpZnkodGhpcy5jb2xsYXBzZWQpKTsgfSBjYXRjaCAoZSkge30KICAgICAgICB9LAoKICAgICAgICAvLyBBYnNjaG5pdHQgaG9jaC9ydW50ZXIgdmVyc2NoaWViZW4gKFJlaWhlbmZvbGdlIGxva2FsIGdlc3BlaWNoZXJ0KQogICAgICAgIG1vdmVDYXQoY2F0LCBkaXIpIHsKICAgICAgICAgIGNvbnN0IHZpcyA9IHRoaXMuY2F0ZWdvcmllcygpOwogICAgICAgICAgY29uc3QgaSA9IHZpcy5pbmRleE9mKGNhdCk7CiAgICAgICAgICBjb25zdCBqID0gaSArIGRpcjsKICAgICAgICAgIGlmIChpIDwgMCB8fCBqIDwgMCB8fCBqID49IHZpcy5sZW5ndGgpIHJldHVybjsKICAgICAgICAgIHZpcy5zcGxpY2UoaSwgMSk7CiAgICAgICAgICB2aXMuc3BsaWNlKGosIDAsIGNhdCk7CiAgICAgICAgICB0aGlzLmNhdE9yZGVyID0gdmlzLmNvbmNhdCh0aGlzLmNhdE9yZGVyLmZpbHRlcihjID0+ICF2aXMuaW5jbHVkZXMoYykpKTsKICAgICAgICAgIHRyeSB7IGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdwbF9jYXRPcmRlcicsIEpTT04uc3RyaW5naWZ5KHRoaXMuY2F0T3JkZXIpKTsgfSBjYXRjaCAoZSkge30KICAgICAgICB9LAoKICAgICAgICBhc3luYyBsb2FkKCkgewogICAgICAgICAgaWYgKHRoaXMuZWRpdGluZ0lkICE9PSBudWxsKSByZXR1cm47IC8vIG5pY2h0IG1pdHRlbiBpbSBCZWFyYmVpdGVuIG5ldSBsYWRlbgogICAgICAgICAgdGhpcy5sb2FkaW5nID0gdHJ1ZTsKICAgICAgICAgIHRyeSB7CiAgICAgICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCcvd2ViaG9vay9wYWNrbGlzdGUvaXRlbXMnLCB7IGNhY2hlOiAnbm8tc3RvcmUnIH0pOwogICAgICAgICAgICBpZiAocmVzLm9rKSB0aGlzLml0ZW1zID0gYXdhaXQgcmVzLmpzb24oKTsKICAgICAgICAgIH0gY2F0Y2ggKGUpIHt9IGZpbmFsbHkgeyB0aGlzLmxvYWRpbmcgPSBmYWxzZTsgfQogICAgICAgIH0sCiAgICAgICAgYXN5bmMgdG9nZ2xlKGl0ZW0pIHsKICAgICAgICAgIGl0ZW0uY29tcGxldGVkID0gIWl0ZW0uY29tcGxldGVkOwogICAgICAgICAgdHJ5IHsKICAgICAgICAgICAgYXdhaXQgZmV0Y2goJy93ZWJob29rL3BhY2tsaXN0ZS90b2dnbGUnLCB7CiAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LAogICAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgaWQ6IGl0ZW0uaWQsIGNvbXBsZXRlZDogaXRlbS5jb21wbGV0ZWQgfSkKICAgICAgICAgICAgfSk7CiAgICAgICAgICB9IGNhdGNoIChlKSB7IGl0ZW0uY29tcGxldGVkID0gIWl0ZW0uY29tcGxldGVkOyB9CiAgICAgICAgfSwKCiAgICAgICAgLy8gQmVhcmJlaXRlbiBkZXMgVGV4dGVzCiAgICAgICAgc3RhcnRFZGl0KGl0ZW0pIHsKICAgICAgICAgIGlmICh0eXBlb2YgaXRlbS5pZCA9PT0gJ3N0cmluZycgJiYgaXRlbS5pZC5zdGFydHNXaXRoKCd0bXAtJykpIHJldHVybjsgLy8gZXJzdCBuYWNoIGRlbSBTcGVpY2hlcm4KICAgICAgICAgIHRoaXMuZWRpdGluZ0lkID0gaXRlbS5pZDsKICAgICAgICAgIHRoaXMuZWRpdFRleHQgPSBpdGVtLnRpdGxlOwogICAgICAgICAgdGhpcy5lZGl0Q2F0QmVmb3JlID0gaXRlbS5jYXRlZ29yeSB8fCAnU29uc3RpZ2VzJzsKICAgICAgICAgIHRoaXMuJG5leHRUaWNrKCgpID0+IHsgaWYgKHRoaXMuJHJlZnMuZWRpdCkgeyB0aGlzLiRyZWZzLmVkaXQuZm9jdXMoKTsgdGhpcy4kcmVmcy5lZGl0LnNlbGVjdCgpOyB9IH0pOwogICAgICAgIH0sCiAgICAgICAgY2FuY2VsRWRpdCgpIHsgdGhpcy5lZGl0aW5nSWQgPSBudWxsOyB0aGlzLmVkaXRUZXh0ID0gJyc7IH0sCiAgICAgICAgYXN5bmMgc2F2ZUVkaXQoaXRlbSkgewogICAgICAgICAgaWYgKHRoaXMuZWRpdGluZ0lkICE9PSBpdGVtLmlkKSByZXR1cm47CiAgICAgICAgICBjb25zdCB0ID0gKHRoaXMuZWRpdFRleHQgfHwgJycpLnRyaW0oKTsKICAgICAgICAgIHRoaXMuZWRpdGluZ0lkID0gbnVsbDsKICAgICAgICAgIGlmICh0ICYmIHQgIT09IGl0ZW0udGl0bGUpIHsKICAgICAgICAgICAgaXRlbS50aXRsZSA9IHQ7CiAgICAgICAgICAgIHRoaXMucGVyc2lzdChpdGVtKTsKICAgICAgICAgIH0KICAgICAgICB9LAoKICAgICAgICAvLyDDhG5kZXJ1bmcgKFRpdGVsIHVuZC9vZGVyIEthdGVnb3JpZSkgc3BlaWNoZXJuCiAgICAgICAgYXN5bmMgcGVyc2lzdChpdGVtKSB7CiAgICAgICAgICB0cnkgewogICAgICAgICAgICBhd2FpdCBmZXRjaCgnL3dlYmhvb2svcGFja2xpc3RlL3VwZGF0ZScsIHsKICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJywgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sCiAgICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBpZDogaXRlbS5pZCwgdGl0bGU6IGl0ZW0udGl0bGUsIGNhdGVnb3J5OiBpdGVtLmNhdGVnb3J5IH0pCiAgICAgICAgICAgIH0pOwogICAgICAgICAgfSBjYXRjaCAoZSkge30KICAgICAgICB9LAoKICAgICAgICBhc3luYyBzdWJtaXRBZGQoKSB7CiAgICAgICAgICBjb25zdCB0aXRsZSA9ICh0aGlzLm5ld1RpdGxlIHx8ICcnKS50cmltKCk7CiAgICAgICAgICBpZiAoIXRpdGxlKSByZXR1cm47CiAgICAgICAgICBjb25zdCBjYXRlZ29yeSA9IHRoaXMubmV3Q2F0IHx8ICdTb25zdGlnZXMnOwogICAgICAgICAgdGhpcy5uZXdUaXRsZSA9ICcnOwogICAgICAgICAgY29uc3Qgb3B0aW1pc3RpYyA9IHsgaWQ6ICd0bXAtJyArIERhdGUubm93KCksIHRpdGxlOiB0aXRsZSwgY2F0ZWdvcnk6IGNhdGVnb3J5LCBjb21wbGV0ZWQ6IGZhbHNlIH07CiAgICAgICAgICB0aGlzLml0ZW1zLnB1c2gob3B0aW1pc3RpYyk7CiAgICAgICAgICB0cnkgewogICAgICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCgnL3dlYmhvb2svcGFja2xpc3RlL2FkZCcsIHsKICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJywgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sCiAgICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyB0aXRsZTogdGl0bGUsIGNhdGVnb3J5OiBjYXRlZ29yeSB9KQogICAgICAgICAgICB9KTsKICAgICAgICAgICAgaWYgKHJlcy5vaykgewogICAgICAgICAgICAgIGNvbnN0IGNyZWF0ZWQgPSBhd2FpdCByZXMuanNvbigpOwogICAgICAgICAgICAgIGNvbnN0IHJvdyA9IEFycmF5LmlzQXJyYXkoY3JlYXRlZCkgPyBjcmVhdGVkWzBdIDogY3JlYXRlZDsKICAgICAgICAgICAgICBpZiAocm93ICYmIHJvdy5pZCkgT2JqZWN0LmFzc2lnbihvcHRpbWlzdGljLCByb3cpOwogICAgICAgICAgICB9CiAgICAgICAgICB9IGNhdGNoIChlKSB7fQogICAgICAgIH0sCiAgICAgICAgYXN5bmMgcmVtb3ZlKGl0ZW0pIHsKICAgICAgICAgIHRoaXMuaXRlbXMgPSB0aGlzLml0ZW1zLmZpbHRlcihpID0+IGkuaWQgIT09IGl0ZW0uaWQpOwogICAgICAgICAgdHJ5IHsKICAgICAgICAgICAgYXdhaXQgZmV0Y2goJy93ZWJob29rL3BhY2tsaXN0ZS9kZWxldGUnLCB7CiAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LAogICAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgaWQ6IGl0ZW0uaWQgfSkKICAgICAgICAgICAgfSk7CiAgICAgICAgICB9IGNhdGNoIChlKSB7fQogICAgICAgIH0KICAgICAgfTsKICAgIH0KICA8L3NjcmlwdD4KPC9ib2R5Pgo8L2h0bWw+Cg==';
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
