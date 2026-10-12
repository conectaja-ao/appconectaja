# Hey Claude — abre o Claude com a voz

Tal como o "Hey Google" abre o Assistente Google, este programa fica a ouvir
o microfone e, quando dizes **"Hey Claude"** (ou "Hey Cloud"), faz isto:

1. toca um "bip" de confirmação;
2. abre o Claude: a app de desktop, se estiver instalada, ou o
   [claude.ai](https://claude.ai/new) no navegador;
3. põe a janela do Claude à frente e liga o **ditado por voz do Windows**
   (`Win+H`), para falares logo a tua pergunta.

A deteção da frase é feita **no teu computador, sem internet**, com o
[Vosk](https://alphacephei.com/vosk/). O áudio do microfone nunca sai do PC.
Só é preciso internet na instalação, para descarregar o Vosk e o modelo de voz
(~40 MB).

## Instalar (Windows 10 ou 11)

1. Copia esta pasta `hey-claude` para o computador (por exemplo, descarrega o
   ZIP e extrai-o).
2. Faz duplo clique em **`instalar.bat`**.
   - Se não tiveres o Python, o instalador tenta instalá-lo com o `winget`.
     Se não conseguir, instala-o em <https://www.python.org/downloads/>
     (marca **"Add python.exe to PATH"**) e volta a correr o `instalar.bat`.
3. Quando aparecer "Hey Claude instalado e a correr!", diz **"Hey Claude"**.

O programa fica instalado em `%LOCALAPPDATA%\HeyClaude` e **arranca sozinho**
sempre que ligas o computador. Não abre janela nenhuma: corre em segundo plano.

> Se não reagir, confirma em *Definições → Privacidade e segurança → Microfone*
> que a opção **"Permitir que as aplicações de ambiente de trabalho acedam ao
> microfone"** está ligada.

## Ficheiros

| Ficheiro          | Para que serve                                                         |
|-------------------|------------------------------------------------------------------------|
| `instalar.bat`    | Instala (ou atualiza) e põe a correr. Pode ser corrido mais vezes.      |
| `diagnostico.bat` | Mostra em tempo real o que o microfone está a ouvir. Ctrl+C para sair. |
| `testar.bat`      | Abre o Claude como se tivesses dito "Hey Claude" (testa sem falar).     |
| `desinstalar.bat` | Pára o programa, tira-o do arranque e apaga a pasta instalada.          |
| `hey_claude.py`   | O programa em si.                                                       |
| `config.json`     | Configuração inicial (copiada na primeira instalação).                  |

## Configuração

Edita `%LOCALAPPDATA%\HeyClaude\config.json` (com o Bloco de Notas). As
alterações são aplicadas sozinhas em poucos segundos, sem reiniciar nada.

| Opção                           | Padrão                     | O que faz |
|---------------------------------|----------------------------|-----------|
| `frases_ativacao`               | `["hey claude", "hey cloud", "hi claude", "okay claude"]` | Frases que ativam. Palavras em inglês, em minúsculas. |
| `confianca_minima`              | `0.6`                      | De 0 a 1. Sobe se abrir sozinho; desce se não te reconhecer. |
| `abrir`                         | `"auto"`                   | `"auto"` (app se existir, senão navegador), `"app"` ou `"web"`. |
| `url_web`                       | `"https://claude.ai/new"`  | Endereço aberto no navegador. |
| `caminho_app`                   | `""`                       | Caminho do `claude.exe`, se a app estiver num sítio fora do normal. |
| `atalho_apos_abrir`             | `"win+h"`                  | Atalho carregado com o Claude à frente. `"win+h"` = ditado do Windows; `"ctrl+alt+space"` = chat rápido da app; `""` = nenhum. |
| `atraso_atalho_segundos`        | `1.5`                      | Espera antes de carregar o atalho (para a página acabar de carregar). |
| `espera_maxima_janela_segundos` | `15`                       | Quanto tempo esperar pela janela do Claude. |
| `som_confirmacao`               | `true`                     | Toca um "bip" quando ouve a frase. |
| `pausa_apos_ativacao_segundos`  | `8`                        | Ignora novas ativações durante este tempo. |
| `microfone`                     | `null`                     | `null` = microfone padrão do Windows; ou parte do nome do microfone, ex.: `"USB"`. |

## Se não te reconhecer bem

Corre o `diagnostico.bat` e diz a frase algumas vezes. Vais ver linhas como:

```
  ouvi: "hey claude"  -> "hey claude" confiança 1.00  >>> ATIVADO
  ouvi: "hey call [unk]"  (não é a frase de ativação)
```

- Se aparecer outra palavra em vez de `claude`/`cloud`, experimenta dizer
  "Hey **Clóde**" ou "Hey **Cláud**", de seguida e sem pausa entre as palavras.
- Se a confiança ficar abaixo do mínimo, baixa a `confianca_minima` (ex.: `0.4`).
- Se nada aparecer quando falas, o microfone escolhido não é o certo:
  define a opção `microfone`.
- O registo fica em `%LOCALAPPDATA%\HeyClaude\hey_claude.log`.

## Limitações

- A app do Claude no Windows não tem (ainda) um atalho de teclado oficial para
  o modo de voz. Por isso o programa usa o ditado do próprio Windows (`Win+H`):
  falas, o texto aparece na caixa do Claude e carregas **Enter** para enviar.
  O ditado usa o idioma do Windows (por exemplo, português).
- Frases com som quase igual, como "Hey Clown" ou "Ei, Cláudio!", também podem
  ativá-lo.
- Enquanto o programa corre, o Windows mostra o ícone de microfone em uso na
  barra de tarefas — é normal, é assim que ele te consegue ouvir.
- Precisa de Windows de 64 bits num processador Intel/AMD (não funciona em
  Windows ARM).

## Desinstalar

Faz duplo clique em `desinstalar.bat`.
