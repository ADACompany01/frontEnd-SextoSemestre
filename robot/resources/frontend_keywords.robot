*** Settings ***
Library    SeleniumLibrary
Library    OperatingSystem
Resource   ../variables/frontend_variables.robot

*** Keywords ***
Abrir Aplicacao Web
    Create Directory    ${SCREENSHOT_DIR}
    Open Browser    ${FRONTEND_URL}    ${BROWSER}
    Set Selenium Timeout    ${SELENIUM_TIMEOUT}
    Set Window Size    1366    768
    Wait Until Page Contains Element    css:body

Fechar Aplicacao Web
    Run Keyword And Ignore Error    Capture Page Screenshot    ${SCREENSHOT_DIR}/frontend-final.png
    Run Keyword And Ignore Error    Close Browser

Acessar Rota
    [Arguments]    ${rota}
    Go To    ${FRONTEND_URL}/#${rota}
    Wait Until Page Contains Element    css:body

Validar Campo Do Formulario
    [Arguments]    ${seletor}
    Wait Until Page Contains Element    ${seletor}
    Element Should Be Visible    ${seletor}
