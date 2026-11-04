; The NSIS target does not generate Windows URL handlers from protocols metadata.
; SHELL_CONTEXT follows the selected per-user/per-machine installation scope.
!macro customInstall
  WriteRegStr SHELL_CONTEXT "Software\Classes\oryx-live" "" "URL:Oryx password reset"
  WriteRegStr SHELL_CONTEXT "Software\Classes\oryx-live" "URL Protocol" ""
  WriteRegStr SHELL_CONTEXT "Software\Classes\oryx-live\DefaultIcon" "" '"$INSTDIR\${APP_EXECUTABLE_FILENAME}",0'
  WriteRegStr SHELL_CONTEXT "Software\Classes\oryx-live\shell\open\command" "" '"$INSTDIR\${APP_EXECUTABLE_FILENAME}" "%1"'
!macroend

!macro customUnInstall
  ; Never remove a handler that another installation now owns.
  ReadRegStr $R0 SHELL_CONTEXT "Software\Classes\oryx-live\shell\open\command" ""
  StrCmp $R0 '"$INSTDIR\${APP_EXECUTABLE_FILENAME}" "%1"' 0 +2
  DeleteRegKey SHELL_CONTEXT "Software\Classes\oryx-live"
!macroend
