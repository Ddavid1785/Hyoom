!macro NSIS_HOOK_POSTINSTALL
  ; Move DLLs from resources subfolder to root (Next to exe)
  Rename "$INSTDIR\resources\vosk_dlls\libvosk.dll" "$INSTDIR\libvosk.dll"
  Rename "$INSTDIR\resources\vosk_dlls\libgcc_s_seh-1.dll" "$INSTDIR\libgcc_s_seh-1.dll"
  Rename "$INSTDIR\resources\vosk_dlls\libstdc++-6.dll" "$INSTDIR\libstdc++-6.dll"
  Rename "$INSTDIR\resources\vosk_dlls\libwinpthread-1.dll" "$INSTDIR\libwinpthread-1.dll"
  
  RMDir "$INSTDIR\resources\vosk_dlls"
!macroend

!macro NSIS_HOOK_PREUNINSTALL
  Delete "$INSTDIR\libvosk.dll"
  Delete "$INSTDIR\libgcc_s_seh-1.dll"
  Delete "$INSTDIR\libstdc++-6.dll"
  Delete "$INSTDIR\libwinpthread-1.dll"
!macroend