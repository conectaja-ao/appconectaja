# Hey Claude para Android

App para o telemóvel que fica a ouvir e, quando dizes **"Hey Claude"** (ou
"Hey Cloud"), faz como o "Hey Google":

1. vibra e toca um "bip";
2. acende o ecrã e pede o desbloqueio, se o telefone estiver bloqueado;
3. abre a app do **Claude** e carrega sozinha no botão do **modo de voz**,
   para começares logo a falar.

A frase é reconhecida **no próprio telefone, sem internet**, com o
[Vosk](https://alphacephei.com/vosk/). O som do microfone nunca sai do telefone.
Só é preciso internet uma vez, para descarregar o modelo de voz (~40 MB).
(O modo de voz do Claude, esse sim, precisa de internet, como sempre.)

## Instalar

1. Instala a app do Claude da Play Store, se ainda não a tiveres, e entra na tua conta.
2. Descarrega o ficheiro **`HeyClaude.apk`** para o telefone e abre-o.
   - O Android vai pedir para **permitir instalar apps desta fonte**
     (do navegador ou da app de ficheiros): aceita.
   - Se o Play Protect avisar que a app é desconhecida, toca em
     **"Mais detalhes" → "Instalar mesmo assim"**. (É normal: a app não vem da Play Store.)
3. Abre a app **Hey Claude** e segue a lista de passos no ecrã:

| Passo | Para quê |
|-------|----------|
| 1. Modelo de voz | Descarrega ~40 MB, só uma vez (de preferência com Wi-Fi). |
| 2. Microfone | Para ouvir "Hey Claude". |
| 3. Notificações | Para mostrar que está a ouvir e avisar se o Android a desligar. |
| 4. App do Claude | Tem de estar instalada. |
| 5. Acessibilidade | Para abrir o Claude sozinha e carregar no botão do modo de voz. |
| 6. Bateria sem restrições | Para o Android não a desligar ao fim de algum tempo. |

4. Liga o interruptor **"Hey Claude ligado"** e diz **"Hey Claude"**.

### Acessibilidade aparece cinzenta ("Definição restrita")

Nos Android 13 e mais recentes, as apps instaladas a partir de um ficheiro têm a
acessibilidade bloqueada até autorizares:

1. Na app Hey Claude, toca em **"Info da app (definições restritas)"**.
2. Toca no menu **⋮** (canto superior direito) → **"Permitir definições restritas"**.
3. Volta a **"Ligar a acessibilidade"** e liga o **Hey Claude**.

O serviço de acessibilidade só funciona dentro da app do Claude. Não lê nem guarda
nada de outras apps.

### Xiaomi, Tecno, Infinix, Itel, Samsung, Huawei…

Estas marcas costumam fechar apps em segundo plano. Além do passo 6, procura nas
definições da app Hey Claude opções como **"Arranque automático"**,
**"Sem restrições"** ou **"Não otimizar"** e ativa-as.
Na lista de apps recentes, também podes **bloquear** a Hey Claude (ícone de cadeado).

## Usar

- Diz **"Hey Claude"** de seguida, sem pausa entre as palavras. Também funciona
  "Hey Cloud", "Hi Claude" e "Okay Claude".
- Na secção **"O que ouvi"** da app vês o que o telefone percebeu. É útil se não
  te reconhecer à primeira.
- Mosaico rápido: nas **definições rápidas** (puxar a barra de cima), edita os
  mosaicos e junta o **Hey Claude** para ligar e desligar com um toque.
- Depois de reiniciar o telefone, a app volta a ligar-se sozinha se a
  acessibilidade estiver ligada. Se o Android não deixar, aparece uma notificação:
  **toca nela uma vez** para voltar a ligar.

### Se carregar no botão errado (ou em nenhum)

Não consegui confirmar o nome exato do botão do modo de voz na app do Claude, por
isso a Hey Claude procura-o pelo nome ("Voice mode", "Modo de voz", etc.). Se não
o encontrar:

1. Na app Hey Claude, toca em **"Escolher o botão do modo de voz"**.
2. O Claude abre e, uns segundos depois, a Hey Claude volta com a lista dos botões
   que viu.
3. Escolhe o do modo de voz (o ícone de ondas sonoras ao lado do microfone).

Se preferires que só abra o Claude, sem carregar em botão nenhum, desliga
**"Abrir logo o modo de voz do Claude"**.

## Limitações

- **Bateria:** ouvir o microfone o tempo todo gasta mais bateria do que o normal.
  Desliga no mosaico rápido quando não precisares.
- Frases com som quase igual, como "Hey Clown" ou "Ei, Cláudio!", também podem
  ativá-la.
- Enquanto está ligada, o Android mostra o indicador de microfone em uso e uma
  notificação fixa. É obrigatório e é assim que ela te consegue ouvir.
- Precisa de Android 7 ou mais recente, num telefone ARM (praticamente todos).

## Compilar a partir do código

Precisa do JDK 17+ e do Android SDK (plataforma 35):

```
./gradlew assembleRelease
```

O modelo de voz não vai dentro da APK (que fica com ~6 MB): a app descarrega-o
de alphacephei.com na primeira utilização. Sem `keystore.properties`, a APK é assinada com a chave de debug. Uma APK assinada
com outra chave não atualiza a que já está instalada: desinstala primeiro.
