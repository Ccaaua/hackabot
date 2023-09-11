# HackaBot - Código Fonte e suas Funcionalidades.

Bem-vindo(a) ao repositório oficial do HackaBot, um projeto desenvolvido para o Hackathon Acadêmico promovido pela Robótica Paula Souza, do Centro Paula Souza.

## Objetivo do HackaBot

O principal propósito do HackaBot é automatizar todas as etapas relacionadas à mentoria durante o Hackathon entre as Etecs, do Centro Paula Souza. Este projeto foi desenvolvido com a supervisão do Coordenador Tiago Souza, Andréia de Càssia dos Santos e à Daiani Mariano de Brito, garantindo a conformidade com todos os requisitos.

## Créditos

Gostaria de agradecer ao meu amigo David Venturini, que contribuiu para a criação da estrutura(esqueleto) inicial do bot.

## Funcionalidades Principais

### Processamento de Dados Iniciais

O HackaBot inicia lendo os arquivos .json denominados "groups" e "mentores". Com base nas informações do arquivo "groups", ele cria uma categoria com o nome da equipe, composta por um canal de texto, um canal de voz e um cargo, todos com o nome da equipe correspondente. Além disso, ele pré-cadastra os Orientadores das equipes no banco de dados. Os arquivos .json são gerados a partir de planilhas do Excel e convertidos para o formato .json.

### Identificação e Cadastro

Ao executar o comando "/identificação", os participantes e orientadores podem se identificar usando o código de equipe (groupID) ou mentor (mentorID). Com o código da equipe, os participantes e orientadores podem selecionar seus nomes por meio de um botão, e o HackaBot os cadastra no banco de dados e atribui o cargo correspondente à equipe ou ao orientador. Com o código do mentor, os participantes podem confirmar seus dados e o HackaBot conclui o cadastro e atribui o cargo de Mentor.

### Permissões e Interações

- O cargo de equipe permite que os membros leiam sua categoria, que inclui canais de texto e voz para facilitar a comunicação entre equipe, orientador e mentor.
- Os membros com o cargo de equipe podem solicitar mentoria através do botão "solicitar mentoria" no canal de texto "solicitar-mentoria".
- O cargo de mentor permite que os mentores leiam a categoria "MENTORES", que inclui canais de texto para comunicação entre eles e um canal chamado "solicitação-mentoria", onde o HackaBot envia mensagens com os nomes das equipes que solicitam mentoria e um botão para os mentores escolherem as equipes que desejam orientar.

### Mentoria e Denúncias

- Após aceitar uma equipe para orientação, o mentor recebe o cargo da equipe, obtendo acesso total à categoria dela. Para encerrar a mentoria, o mentor pode usar o comando "/mentor finalizar-mentoria <feedback>". Isso remove automaticamente o cargo da equipe, tornando-o disponível para mentoria novamente.
- Os mentores também têm a opção de denunciar equipes usando "/mentor denunciar-equipe <nomeequipe> <motivo>".

### Chamadas e Suporte

- Tanto participantes quanto mentores podem usar o comando "/chamada" para exibir informações de tempo em chamadas.
- No canal de texto "solicitar-mentoria", há um botão "solicitar ticket" que permite que mentores, participantes e orientadores criem um canal de texto na categoria "Tickets Abertos" para tirar dúvidas, obter ajuda ou relatar problemas. Administradores podem adicionar ou remover permissões usando comandos específicos.

### Outras Funcionalidades

- O HackaBot também oferece comandos como "/basicResume" para informações básicas sobre o banco de dados, "/blacklist" para gerenciar a lista proibida de usuários, "/manutenção" para ligar/desligar a manutenção do bot (com suporte para uma lista de permissões), "/resumo" para gerar imagens informativas e o comando "load" para ler os arquivos .json e realizar cadastros ou pré-cadastros de dados.

Esperamos que o HackaBot seja uma ferramenta valiosa, simplificando a gestão de equipes, orientadores e mentores. Obrigado por utilizar nosso bot e por fazer parte deste evento empolgante!
