# hackabot
Eis aqui o Código Aberto (Open Source) do HackaBot. 

Nesse repositório, você encontrará todas as linhas criadas/digitadas para dar a vida ao HackaBot.

O propósito do Bot é automatizar toda a etapa de "Mentoria" do HackaThon entre Etecs do Centro Paula Souza.
Com supervisão do Coordenador Tiago Souza e da Andréia de Càssia dos Santos, foi possivel estabelecer todos os requisitos.

Primeiramente, gostaria de dar créditos ao meu amigo David Venturini, o qual foi responsável pela estrutura do bot.

De inicio, o Hacka deve ler os .json: groups e mentores. 
Com as informações de "groups", ele criará uma categoria, com o nome da equipe, composta por um canal de texto, um canal de voz e um cargo, também com o nome da equipe. No mesmo seguimento, ele cadastrará previamente os Orientadores das equipes no banco de dados.
Com as informações de "mentores", ele cadastrará previamente os dados dos mentores no banco de dados.

Executando o comando "/identificação", deve ser possivel se identificar com código de equipe ou mentor.
Com o código de equipe, o participante/orientador conseguirá escolher, a partir de um botão, seu nome. Assim, o bot cadastrará ele no banco de dados e irá atribui-lo o cargo de sua equipe.
Com o código de mentor, o participante conseguirá confirmar, a partir de um botão, seus dados. Assim, o bot irá finalizar o seu cadastro no banco de dados e irá atribui-lo o cargo de Mentor.

O cargo de equipe, tem permissão apenas para ler a sua categoria. Como anteriormente dito, contem "chat-equipe" e "voz-equipe", para a equipe, orientador e o cujo mentor conversarem.
O cargo de equipe, também tem permissão para solicitar a mentoria, clicando no botão "solicitar mentoria" disponivel no canal de texto "solicitar-mentoria".

O cargo de mentor, tem permissão para ler a categoria "MENTORES". No qual contém o "chat-mentores", para conversarem entrem si, e "solitação-mentoria", canal de texto que o bot irá enviar uma mensagem com o nome da equipe, que está solicitando mentoria, e um botão para o mentor mais rápido clica-lo e ter a oportunidade de mentorar.
Após clicar em "Mentorar", o mentor irá receber o cargo da tal equipe e tendo acesso total a sua categoria.
Para finalizar a mentoria, o mentor digitará "/mentor finalizar-mentoria <feedback>. Assim o bot, automaticamente, irá remover o cargo da equipe.
O mentor poderá denunciar tal equipe utilizando "/mentor denunciar-equipe <nome_equipe> <motivo>.

Tanto participante ou mentor, poderá utilizar o comando "/chamada". Comando para exibir informações de tempo em chamadas. 




