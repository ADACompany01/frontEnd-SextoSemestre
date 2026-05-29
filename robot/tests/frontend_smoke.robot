*** Settings ***
Documentation     Testes locais de interface com Robot Framework e SeleniumLibrary.
Resource          ../resources/frontend_keywords.robot
Test Teardown     Fechar Aplicacao Web

*** Test Cases ***
Pagina Inicial Deve Carregar Com Conteudo Principal
    [Documentation]    Valida se a home abre e exibe a marca e chamada principal.
    Abrir Aplicacao Web
    Wait Until Page Contains    AdaCompany
    Page Should Contain    Ada
    Page Should Contain    Conversar com a Ada
    Capture Page Screenshot    ${SCREENSHOT_DIR}/home.png

Tela De Login Deve Exibir Formulario
    [Documentation]    Valida campos principais da tela de login.
    Abrir Aplicacao Web
    Acessar Rota    /signin
    Wait Until Page Contains    Login
    Validar Campo Do Formulario    css:input[type="email"]
    Validar Campo Do Formulario    css:input[type="password"]
    Validar Campo Do Formulario    css:button[type="submit"]
    Capture Page Screenshot    ${SCREENSHOT_DIR}/login.png

Chatbot Deve Abrir Atendimento Guiado
    [Documentation]    Valida abertura do chatbot AdaCompany na home.
    Abrir Aplicacao Web
    Wait Until Page Contains Element    css:button[aria-label="Abrir chatbot"]
    Click Button    css:button[aria-label="Abrir chatbot"]
    Wait Until Page Contains    Atendimento AdaCompany
    Page Should Contain    Como posso ajudar
    Capture Page Screenshot    ${SCREENSHOT_DIR}/chatbot.png
