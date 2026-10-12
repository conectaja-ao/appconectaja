# Hey Claude para Android

Um assistente de voz como o "Hey Google", mas com o Claude:

1. dizes **"Hey Claude"** (ou "Hey Cloud");
2. aparece a **bolinha** do assistente por cima do que estiver no ecrã;
3. pedes o que quiseres, por exemplo:
   - «abre o YouTube», «abre o calendário»
   - «pesquisa o tempo em Luanda»
   - «manda uma mensagem ao João pelo WhatsApp a dizer que chego às cinco»
   - «envia uma SMS à Maria a dizer estou a caminho», «liga para a Ana»
   - «põe um alarme para as 6 e meia», «temporizador de 10 minutos»
   - «marca uma reunião amanhã às 15h», «leva-me ao aeroporto»
   - «liga a lanterna», «põe kizomba no YouTube»
   - ou qualquer pergunta: «quantos quilómetros tem o rio Kwanza?»
4. o Claude percebe o pedido, faz a ação no telemóvel e responde em voz alta.

Mensagens e chamadas **só avançam depois de confirmares** (dizendo «sim» ou
tocando em Confirmar).

## Como funciona

- A frase "Hey Claude" é reconhecida **no próprio telemóvel, sem internet**, com o
  [Vosk](https://alphacephei.com/vosk/). Até a dizeres, nada sai do telemóvel.
- O teu pedido é passado a texto pelo reconhecimento de voz do Android (o da Google).
- O texto vai para o **Claude** (API da Anthropic), que decide o que fazer: responder
  ou usar uma das ações (abrir app, pesquisar, WhatsApp, SMS, chamada, calendário,
  alarme, temporizador, mapa, YouTube, lanterna).
- A app executa a ação no telemóvel e lê a resposta em voz alta.

### Chave da API

Para o Claude perceber os pedidos, é preciso uma **chave da API da Anthropic**:

1. Cria uma conta em <https://console.anthropic.com>, adiciona crédito e cria uma chave
   (começa por `sk-ant-`).
2. Na app Hey Claude, cola-a no passo 4 e toca em **Guardar chave**.

A API paga-se à parte da subscrição do Claude, por utilização. Na app podes escolher o
modelo: **Opus 5.5** (o mais inteligente, padrão), **Sonnet 5.5** ou **Haiku 5.5**
(o mais rápido e barato, bom para um assistente de voz).

**Sem chave**, o assistente percebe só comandos simples («abre o …», «pesquisa …»,
«liga para …», «manda mensagem ao … a dizer …», «alarme às …», «lanterna») e, se não
perceber, pesquisa no Google o que disseste.

A chave fica guardada só no telemóvel, na memória privada da app.

## Instalar

1. Descarrega o ficheiro **`HeyClaude.apk`** para o telemóvel e abre-o.
   - Aceita **permitir instalar apps desta fonte**.
   - Se o Play Protect avisar, toca em **"Mais detalhes" → "Instalar mesmo assim"**.
   - Se já tinhas a versão anterior, esta instala-se por cima.
2. Abre a app **Hey Claude** e segue a lista de passos:

| Passo | Para quê |
|-------|----------|
| 1. Modelo de voz | Descarrega ~40 MB, só uma vez (de preferência com Wi-Fi). |
| 2. Microfone | Para ouvir "Hey Claude" e os teus pedidos. |
| 3. Notificações | Para mostrar que está a ouvir. |
| 4. Chave da API | Para o Claude perceber os pedidos (ver acima). |
| 5. Aparecer por cima das outras apps | Para a bolinha abrir sozinha quando dizes "Hey Claude". |
| 6. Contactos, SMS e chamadas | Para enviar mensagens e ligar aos teus contactos. |
| 7. Bateria sem restrições | Para o Android não a desligar. |
| 8. (Opcional) Assistente do telemóvel | Tocar sem soltar no botão de ligar (ou de início) também abre a bolinha. |
| 9. (Opcional) Acessibilidade | Carrega sozinho em «Enviar» no WhatsApp e volta a ligar a app depois de reiniciar. |

3. Liga o interruptor **"Hey Claude ligado"** e diz **"Hey Claude"**.
   Também podes testar com **"Falar com o assistente agora"**.

### Acessibilidade com "Configuração restrita"

1. Na app Hey Claude, toca em **"Info da app (configurações restritas)"**.
2. Toca no menu **⋮** → **"Permitir configurações restritas"** e confirma.
3. Volta a **"Ligar a acessibilidade"** e liga o **Hey Claude — assistente**.

Se o menu ⋮ não tiver essa opção, tenta primeiro ligar a acessibilidade (para aparecer o
aviso) e depois volta à informação da app.

### Tecno, Infinix, Itel, Xiaomi, Samsung…

Estas marcas costumam fechar apps em segundo plano. Além do passo 7, procura nas
definições da app opções como **"Arranque automático"** ou **"Sem restrições"**.

## Limitações

- **Ainda não foi testado num telemóvel real**, só em simulação. Diz o que falhar.
- **WhatsApp:** sem a acessibilidade, a conversa abre com a mensagem escrita e falta
  tocares em Enviar. Com ela, carrega em Enviar sozinho.
- **Calendário:** o evento abre já preenchido no calendário; falta tocares em Guardar.
- **Bateria:** ouvir o microfone o tempo todo gasta mais bateria. Há um botão nas
  definições rápidas para ligar e desligar.
- Frases parecidas, como "Hey Clown" ou "Ei, Cláudio!", também podem chamar o assistente.
- Com o telemóvel bloqueado, o assistente responde a perguntas, mas para fazer ações
  pede primeiro o desbloqueio.
- Depois de reiniciar o telemóvel (Android 11 ou mais recente), se a acessibilidade não
  estiver ligada, aparece uma notificação: toca nela uma vez para voltar a ligar.
- Privacidade: o texto dos teus pedidos (não o áudio) é enviado à Anthropic para o
  Claude responder. A agenda de contactos nunca é enviada; só o nome que disseres.

## Compilar a partir do código

Precisa do JDK 17+ e do Android SDK (plataforma 35):

```
./gradlew assembleRelease
```

Sem `keystore.properties`, a APK é assinada com a chave de debug. Uma APK assinada com
outra chave não atualiza a que já está instalada: desinstala primeiro.
