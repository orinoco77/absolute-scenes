# NSIS script for Windows installer customization
# This adds the application to the system PATH

!macro customInstall
  # Create a batch file for command line access
  FileOpen $0 "$INSTDIR\absolute-scenes.bat" w
  FileWrite $0 '@echo off$\r$\n'
  FileWrite $0 '"$INSTDIR\Absolute Scenes.exe" %*$\r$\n'
  FileClose $0
  
  # Add to system PATH using setx command
  nsExec::ExecToLog 'setx PATH "$INSTDIR;%PATH%" /M'
!macroend

!macro customUnInstall  
  # Remove batch file
  Delete "$INSTDIR\absolute-scenes.bat"
!macroend
