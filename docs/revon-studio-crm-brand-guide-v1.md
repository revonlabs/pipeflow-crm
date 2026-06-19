# Revon Studio CRM — Brand Guidelines v1.0

---

## 1. Visão Geral

**Revon Studio CRM** é o sistema operacional comercial da Revon.

Construído dentro do ecossistema **Revon Studio**, o produto centraliza relacionamento, pipeline, negociações, atividades comerciais e inteligência operacional em uma única plataforma.

Enquanto a Revon Labs representa automação, agentes e sistemas inteligentes, o Studio CRM representa **crescimento, relacionamento e receita**.

> Este documento herda fundamentos do **Revon Labs Brand Guidelines v1.0** e estende com tokens exclusivos do subproduto CRM. Em caso de conflito, este guia prevalece para o CRM. Para tópicos não cobertos aqui, consultar o guia da marca-mãe.

---

## 2. Posicionamento da Marca

### Proposta de Valor
**Transformar relacionamento comercial em crescimento previsível.**

### Arquitetura de Marca
```
Revon Labs (marca-mãe)
└── Revon Studio (plataforma)
    └── Revon Studio CRM (produto)
```

### Personalidade

| Somos                  | Não Somos               |
|------------------------|-------------------------|
| Inteligentes           | Arrogantes              |
| Confiáveis             | Frios ou burocráticos   |
| Premium                | Corporativos demais     |
| Modernos               | Genéricos               |
| Próximos               | Mais um CRM tradicional |
| Orientados a resultado | Abstratos               |

---

## 3. Conceito Visual

### Inspiração: Fox Fire (Revontulet)

O Studio CRM nasce da metáfora **Revontulet** — o nome finlandês para a aurora boreal, que significa literalmente "fogo de raposa".

Assim como a aurora surge do movimento invisível da raposa mítica, o crescimento comercial surge das inúmeras interações invisíveis entre empresa e cliente.

- **Cada oportunidade** gera movimento.
- **Cada relacionamento** gera valor.
- **Cada negociação** gera crescimento.

O produto herda as cores de aurora do ecossistema Revon, mas seu acento primário é o **Fox Fire** — o laranja vivo que representa o subproduto Studio dentro da família Revon.

---

## 4. Logo

### Estrutura

A logo é composta por três elementos:

1. **Símbolo Fox Fire CRM** — arcos curvados em gradiente com nós circulares, evocando a trajetória de relacionamentos e o movimento da raposa
2. **Wordmark "Revon"** — Inter Black 900, branco, letter-spacing -0.04em
3. **Descriptor "Studio CRM"** — "Studio" em Inter 300 uppercase, "CRM" no tom Fox Fire primário

### Variação Principal
| Elemento        | Valor                          |
|-----------------|-------------------------------|
| Fundo           | `#060B14` (Night Deep)        |
| Texto "Revon"   | `#F0F8FF` (Text Primary)      |
| Texto "Studio"  | `#8BACD4` (Text Secondary)    |
| Texto "CRM"     | `#FF7043` (Fox Fire Primary)  |
| Símbolo         | `#FF7043` → `#FFAB40` → `#CE59B2` |

### Clearspace
Área de proteção mínima = altura da letra "R" do wordmark em todos os lados. Nenhum elemento deve invadir essa zona.

### Regras
| ✓ Permitido                                          | ✗ Proibido                                      |
|------------------------------------------------------|--------------------------------------------------|
| Usar sobre Night Deep (`#060B14` a `#112240`)        | Alterar o gradiente do símbolo                  |
| Usar ícone isolado em favicons e espaços pequenos    | Separar símbolo do wordmark na versão primária  |
| Redimensionar proporcionalmente                      | Esticar, distorcer ou rotacionar                |
| Versão monocromática branca em fundos coloridos      | Adicionar sombras externas ao símbolo           |

---

## 5. Sistema de Cores

### Paleta Fox Fire (Primária do CRM)

```css
--crm-primary:      #FF7043;  /* Fox Fire · botões, destaques, KPIs, conversão */
--crm-primary-dark: #E85C32;  /* Fox Fire Dark · hover, estados ativos, selecionados */
--crm-secondary:    #FFAB40;  /* Fox Amber · indicadores, badges, progressão, tooltips */
--crm-highlight:    #FFD180;  /* Fox Light · brilhos, estados positivos, gradientes suaves */
```

**Regra de uso**: O Fox Fire (`#FF7043`) é o acento único da interface. Não usar mais de uma cor de destaque simultaneamente em uma mesma tela. Quando em dúvida, use Fox Fire.

---

### Paleta Night Sky (Herdada da Revon Labs)

```css
--night-deep:   #060B14;  /* Fundo principal da aplicação */
--night-mid:    #0D1B2E;  /* Cards, dropdowns, modais */
--night-soft:   #112240;  /* Painéis, sidebars, headers de seção */
--night-glass:  #162F4A;  /* Hover de itens de lista, estados elevados */
```

---

### Texto (Herdado da Revon Labs)

```css
--text-primary:   #F0F8FF;  /* Títulos, valores, labels de destaque */
--text-secondary: #8BACD4;  /* Corpo, descrições, texto de suporte */
--text-muted:     #4A6785;  /* Metadados, placeholders, legends, labels de eixo */
```

---

### Cores Semânticas

```css
--success:  #3BFFA0;  /* Won, confirmações (Aurora Green da Revon Labs) */
--warning:  #FFAB40;  /* Atenção, prazos próximos (Fox Amber) */
--danger:   #FF4444;  /* Erros, alertas críticos */
--info:     #4A90E2;  /* Informativo, neutro (Aurora Blue da Revon Labs) */
```

---

### Gradientes Oficiais

**CRM Primary Gradient** — Botões principais, barras de progresso, CTAs
```css
background: linear-gradient(135deg, #FF7043 0%, #FF8A50 50%, #FFAB40 100%);
```

**Revenue Gradient** — Dashboards, KPIs, cards premium
```css
background: linear-gradient(135deg, #FF7043, #FFAB40, #FFD180);
```

**Aurora CRM Gradient** — Hero sections, login, splash, marketing
```css
background: linear-gradient(135deg, #FF7043, #FFAB40, #CE59B2);
```

**Night Sky** — Fundos de seção alternados
```css
background: linear-gradient(180deg, #060B14, #0D1B2E, #112240);
```

---

### Sistema de Glow

```css
--glow-orange: rgba(255, 112,  67, 0.45);
--glow-amber:  rgba(255, 171,  64, 0.35);
--glow-pink:   rgba(206,  89, 178, 0.25);
```

Glow é usado apenas em: botões primários no hover, cards de KPI em destaque, e elementos de conversão.  
**Nunca** em texto, ícones, ou elementos de navegação.

---

## 6. Sistema de Pipeline

Cores funcionais — cada estágio tem uma cor semântica única:

| Estágio          | Hex       | Nome                      | Uso                              |
|------------------|-----------|---------------------------|----------------------------------|
| Cold Lead        | `#4A90E2` | Aurora Blue               | Lead inicial, sem qualificação   |
| Warm Lead        | `#FFAB40` | Fox Amber                 | Interesse identificado           |
| Hot Lead         | `#FF7043` | Fox Fire                  | Alta intenção de compra          |
| Opportunity      | `#CE59B2` | Aurora Magenta            | Negociação ativa                 |
| Won              | `#3BFFA0` | Aurora Green              | Venda concluída                  |
| Lost             | `#4A6785` | Text Muted (Night)        | Oportunidade perdida             |

**Regra**: Cada cor de estágio aparece como dot de 8px antes do label e como fill de barra de progresso. Nunca como background de card inteiro.

---

## 7. Tipografia

### Inter (Principal)
Herdada diretamente do Revon Labs. Fonte única da interface — garante consistência com o ecossistema.

| Peso | Nome      | Uso                                      |
|------|-----------|------------------------------------------|
| 400  | Regular   | Corpo de texto, descrições               |
| 500  | Medium    | Labels, itens de menu                    |
| 600  | SemiBold  | Subtítulos, botões, badges               |
| 700  | Bold      | Títulos de seção, headings               |
| 800  | ExtraBold | H1, display, nome de produto             |
| 900  | Black     | Wordmark, hero display                   |

### JetBrains Mono (Monospace)
Herdada do Revon Labs. Usada para dados técnicos e valores precisos.

| Peso | Uso                                                    |
|------|--------------------------------------------------------|
| 400  | Valores monetários, IDs, timestamps, labels de eixo   |
| 600  | Valores KPI em destaque, status de automação           |

Sempre `uppercase` + `letter-spacing: 0.1em` quando usada como label de categoria.

### Hierarquia

| Elemento        | Família    | Tamanho | Peso | Cor             | Extras                      |
|-----------------|------------|---------|------|-----------------|-----------------------------|
| Display / Hero  | Inter      | 48–64px | 900  | text-primary    | letter-spacing: -0.04em     |
| H1              | Inter      | 32–40px | 800  | text-primary    | letter-spacing: -0.03em     |
| H2              | Inter      | 24–28px | 700  | text-primary    | —                           |
| H3 (card title) | Inter      | 16–18px | 600  | text-primary    | —                           |
| Body            | Inter      | 14–15px | 400  | text-secondary  | line-height: 1.7            |
| Label / Caption | Inter      | 12px    | 500  | text-muted      | uppercase, tracking: 0.1em  |
| Valor KPI       | Inter      | 28–36px | 800  | text-primary    | letter-spacing: -0.02em     |
| Delta KPI       | JB Mono    | 11px    | 400  | success/danger  | —                           |
| Stage label     | JB Mono    | 11px    | 600  | text-muted      | uppercase, tracking: 0.15em |
| Valor monetário | JB Mono    | 14px    | 400  | text-primary    | —                           |
| Código / ID     | JB Mono    | 13px    | 400  | crm-primary     | —                           |
| Botão primário  | Inter      | 14px    | 600  | white           | —                           |

---

## 8. Componentes

### Botão Primário
```css
background: linear-gradient(135deg, #FF7043, #FFAB40);
color: #F0F8FF;
padding: 12px 24px;
border-radius: 8px;
font-weight: 600;
font-size: 14px;
border: none;
transition: all 200ms ease;
```

**Hover:**
```css
transform: translateY(-1px);
box-shadow: 0 0 30px rgba(255, 112, 67, 0.55);
```

**Active / Pressed:**
```css
background: linear-gradient(135deg, #E85C32, #FF8A50);
transform: translateY(0);
```

**Disabled:**
```css
opacity: 0.4;
cursor: not-allowed;
```

---

### Botão Secundário
```css
background: rgba(255, 112, 67, 0.08);
color: #FF7043;
border: 1px solid rgba(255, 112, 67, 0.25);
padding: 12px 24px;
border-radius: 8px;
font-weight: 600;
```

**Hover:**
```css
background: rgba(255, 112, 67, 0.14);
border-color: rgba(255, 112, 67, 0.45);
```

---

### Botão Ghost
```css
background: transparent;
color: #8BACD4;
border: 1px solid rgba(255, 255, 255, 0.08);
```

---

### Input / Campo de Texto
```css
background: #0D1B2E;
border: 1px solid rgba(255, 255, 255, 0.08);
border-radius: 8px;
color: #F0F8FF;
padding: 10px 14px;
font-size: 14px;
```

**Focus:**
```css
border-color: #FF7043;
box-shadow: 0 0 0 3px rgba(255, 112, 67, 0.15);
outline: none;
```

**Error:**
```css
border-color: #FF4444;
box-shadow: 0 0 0 3px rgba(255, 68, 68, 0.12);
```

---

### Cards

**Card base:**
```css
background: #0D1B2E;
border: 1px solid rgba(255, 255, 255, 0.06);
border-radius: 12px;
padding: 20px 24px;
```

**Card hover:**
```css
border-color: rgba(255, 112, 67, 0.20);
box-shadow: 0 0 0 1px rgba(255, 112, 67, 0.10);
```

**Card premium / KPI:**
```css
background: linear-gradient(135deg, rgba(255,112,67,0.06), rgba(255,171,64,0.04));
border-color: rgba(255, 112, 67, 0.15);
```

---

### Deal Card (Kanban)
```css
background: #0D1B2E;
border: 1px solid rgba(255, 255, 255, 0.06);
border-radius: 10px;
padding: 14px 16px;
cursor: grab;
transition: all 150ms ease;
```

**Hover:**
```css
border-color: rgba(255, 112, 67, 0.25);
/* Linha de 2px no topo, cor do estágio: */
box-shadow: inset 0 2px 0 0 <stage-color>;
```

**Dragging:**
```css
opacity: 0.7;
cursor: grabbing;
box-shadow: 0 16px 40px rgba(6, 11, 20, 0.6);
border-color: rgba(255, 112, 67, 0.5);
```

**Coluna destino (drag over):**
```css
background: rgba(255, 112, 67, 0.04);
border: 1px dashed rgba(255, 112, 67, 0.3);
```

---

### Badge / Tag

```css
/* Stage badge */
display: inline-flex;
align-items: center;
gap: 6px;
padding: 4px 10px;
border-radius: 100px;
font-family: 'JetBrains Mono', monospace;
font-size: 11px;
font-weight: 600;
letter-spacing: 0.1em;
text-transform: uppercase;
background: rgba(<stage-rgb>, 0.12);
color: <stage-color>;
border: 1px solid rgba(<stage-rgb>, 0.20);
```

**Plan badge (Pro):**
```css
background: linear-gradient(135deg, #FF7043, #FFAB40);
color: white;
```

---

### Border Radius — Escala

| Contexto                         | Valor   |
|----------------------------------|---------|
| Cards principais, modais         | `12px`  |
| Inputs, botões, dropdowns        | `8px`   |
| Chips, badges, tags              | `100px` |
| Avatares, ícones quadrados       | `8px`   |
| Tooltips                         | `6px`   |
| Sub-cards internos               | `8px`   |

Nunca exceder `12px` em containers internos ao app.

---

### Sidebar

```css
background: #060B14;                     /* Night Deep */
border-right: 1px solid rgba(255,255,255,0.06);
width: 240px;                            /* fixa — colapsa em mobile */
```

**Item ativo:**
```css
background: rgba(255, 112, 67, 0.10);
color: #FF7043;
border-right: 2px solid #FF7043;        /* indicador de posição */
```

**Item hover:**
```css
background: rgba(255, 255, 255, 0.04);
color: #F0F8FF;
```

**Item padrão:**
```css
color: #8BACD4;
```

**Logo na sidebar:** Símbolo + wordmark completo. Altura do bloco: 56px.

---

## 9. Dashboards

### Métricas (KPI Grid)

- Grid de 4 colunas separadas por divisor vertical `rgba(255,255,255,0.06)`
- **Label** em JB Mono uppercase, `text-muted`
- **Valor** em Inter 800, `text-primary`, letter-spacing -0.02em
- **Delta** com seta + cor semântica (`success` para positivo, `danger` para negativo)

### Gráficos

- Background: transparente sobre card `night-mid`
- Cores dos eixos: `text-muted`
- Gridlines: `rgba(255,255,255,0.04)`
- Cores das séries: escala Fox Fire (`#FF7043`, `#FFAB40`, `#FFD180`)
- Cor complementar única: Aurora Magenta (`#CE59B2`) para segundo produto/série
- **Nunca** usar arco-íris ou mais de 3 cores simultâneas em um gráfico

### Regras Visuais

- Priorizar escala Fox Fire
- Contraste alto entre dado e fundo
- Visual premium, sem noise ou texturas (reservados para landing page)
- Sem sombras pesadas — `box-shadow` apenas para elevação de modais

---

## 10. Kanban (Pipeline View)

### Coluna

```css
background: rgba(13, 27, 46, 0.5);  /* night-mid semi-transparente */
border: 1px solid rgba(255,255,255,0.05);
border-radius: 12px;
min-width: 280px;
```

**Header da coluna:**
- Dot colorido 8px (cor do estágio) + nome em JB Mono uppercase, `text-muted`
- Contador de cards em badge

**Drop zone vazia:**
```css
border: 1px dashed rgba(255,112,67,0.2);
border-radius: 8px;
background: rgba(255,112,67,0.02);
```

---

## 11. Motion

### Durações

| Tipo                  | Duração     | Easing              |
|-----------------------|-------------|---------------------|
| Microinteração        | 150ms       | ease                |
| Hover (elevação)      | 200ms       | ease                |
| Transição de página   | 300ms       | ease-in-out         |
| Aparição de modal     | 200ms       | ease-out            |
| Glow "respiração"     | 2.5s loop   | ease-in-out         |
| Loading aurora        | contínuo    | ease-in-out (loop)  |
| Reveal on scroll      | 500ms       | ease-out            |

### Loading Aurora (herdado da Revon Labs)
Animação de "shimmer" inspirada na aurora boreal — oscilação suave em X com fade de opacidade, usando as cores Fox Fire ao invés do espectro verde da Revon Labs:

```css
@keyframes auroraShift {
  0%   { transform: translateX(-4%) scaleY(1);   opacity: 0.4; }
  33%  { transform: translateX( 3%) scaleY(1.1); opacity: 0.65; }
  66%  { transform: translateX(-2%) scaleY(0.93);opacity: 0.5; }
  100% { transform: translateX(-4%) scaleY(1);   opacity: 0.4; }
}
```

Gradiente do loading CRM:
```css
background: linear-gradient(180deg, transparent 0%, rgba(255,112,67,0.14) 40%,
  rgba(255,171,64,0.18) 65%, transparent 100%);
filter: blur(48px);
animation: auroraShift 12s ease-in-out infinite;
```

### O que NÃO usar
- Glassmorphism (`backdrop-filter: blur`) em qualquer componente interno ao app
- Gradient text em elementos funcionais da UI
- Partículas em canvas (permitido apenas em landing page com parcimônia)
- `animate-float` ou órbitas decorativas
- Transições acima de 350ms em elementos de UI frequente
- Múltiplas cores de glow simultâneas

---

## 12. Tailwind Config

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // Fox Fire (CRM accent)
        'crm-primary':      '#FF7043',
        'crm-primary-dark': '#E85C32',
        'crm-secondary':    '#FFAB40',
        'crm-highlight':    '#FFD180',

        // Night Sky (Revon Labs inherited)
        'night-deep':  '#060B14',
        'night-mid':   '#0D1B2E',
        'night-soft':  '#112240',
        'night-glass': '#162F4A',

        // Text
        'text-primary':   '#F0F8FF',
        'text-secondary': '#8BACD4',
        'text-muted':     '#4A6785',

        // Semantic
        'status-success': '#3BFFA0',
        'status-warning': '#FFAB40',
        'status-danger':  '#FF4444',
        'status-info':    '#4A90E2',

        // Pipeline stages
        'stage-cold':   '#4A90E2',
        'stage-warm':   '#FFAB40',
        'stage-hot':    '#FF7043',
        'stage-opp':    '#CE59B2',
        'stage-won':    '#3BFFA0',
        'stage-lost':   '#4A6785',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'card':    '12px',
        'input':   '8px',
        'badge':   '100px',
        'tooltip': '6px',
      },
      boxShadow: {
        'glow-orange': '0 0 30px rgba(255,112,67,0.55)',
        'glow-amber':  '0 0 20px rgba(255,171,64,0.35)',
        'glow-focus':  '0 0 0 3px rgba(255,112,67,0.15)',
      },
    },
  },
};
```

---

## 13. CSS Variables (globals.css)

```css
:root {
  /* Fox Fire */
  --crm-primary:      #FF7043;
  --crm-primary-dark: #E85C32;
  --crm-secondary:    #FFAB40;
  --crm-highlight:    #FFD180;

  /* Glow */
  --glow-orange:  rgba(255, 112,  67, 0.45);
  --glow-amber:   rgba(255, 171,  64, 0.35);
  --glow-pink:    rgba(206,  89, 178, 0.25);

  /* Night Sky */
  --night-deep:   #060B14;
  --night-mid:    #0D1B2E;
  --night-soft:   #112240;
  --night-glass:  #162F4A;

  /* Text */
  --text-primary:   #F0F8FF;
  --text-secondary: #8BACD4;
  --text-muted:     #4A6785;

  /* Semantic */
  --success:  #3BFFA0;
  --warning:  #FFAB40;
  --danger:   #FF4444;
  --info:     #4A90E2;

  /* Pipeline */
  --stage-cold:  #4A90E2;
  --stage-warm:  #FFAB40;
  --stage-hot:   #FF7043;
  --stage-opp:   #CE59B2;
  --stage-won:   #3BFFA0;
  --stage-lost:  #4A6785;

  /* Borders */
  --border-default: rgba(255,255,255,0.06);
  --border-subtle:  rgba(255,255,255,0.03);
  --border-accent:  rgba(255,112,67,0.25);

  /* Radius */
  --radius-card:    12px;
  --radius-input:   8px;
  --radius-badge:   100px;
  --radius-tooltip: 6px;
}
```

---

## 14. Aplicação na Interface

### Sidebar
- Background: `night-deep` (`#060B14`)
- Borda direita: `border-default`
- Item ativo: bg `rgba(255,112,67,0.10)` + borda direita 2px `crm-primary` + texto `crm-primary`
- Item hover: bg `rgba(255,255,255,0.04)` + texto `text-primary`
- Logo: símbolo + wordmark completo no topo (56px de altura)
- Mobile: colapsa em `md:hidden`

### Pipeline Kanban
- Header de coluna: dot 8px (cor do estágio) + label em JB Mono uppercase `text-muted`
- Cards: `night-mid` + `border-default`
- Card hover: borda `rgba(crm-primary, 0.25)` + linha top 2px (cor do estágio)
- Valor: JB Mono, cor do estágio
- Drag: card `opacity: 0.7` + shadow elevada. Coluna destino: borda dashed `border-accent`

### Tabela de Leads
- Header: JB Mono uppercase, tracking-wider, `text-muted`
- Rows: hover com bg `night-glass`. Sem zebra stripe.
- Status: dot 8px (cor semântica) + texto
- Valores monetários: JB Mono

### Dashboard
- KPIs: grid com divisores verticais (não cards soltos)
- Gráficos: background transparente, escala Fox Fire
- Labels: JB Mono, valores em Inter Bold

### Formulários
- Campos em `night-mid` + `border-default`
- Focus: `crm-primary` border + `glow-focus` shadow
- Labels: Inter 500 `text-secondary`
- Placeholders: `text-muted`

---

## 15. Planos: Diferenciação Visual

| Plano | Badge                                 | UI hint                                     |
|-------|---------------------------------------|---------------------------------------------|
| Free  | Badge outline cinza                   | Features bloqueadas com ícone de lock        |
| Pro   | Badge gradiente Fox Fire              | Destaque `crm-primary` em KPIs e features   |

---

## 16. Referências de Produto (Inspirações)

Produtos com visual premium que orientam as decisões de interface:

- **Linear** — velocidade, keyboard-first, densidade de informação
- **Attio** — beleza de dados relacionais, tipografia forte
- **Raycast** — command palette, fluidez, premium dark
- **Vercel Dashboard** — métricas, gráficos, clareza técnica
- **Arc Browser** — cor como identidade, sem medo de escuro

---

## 17. Princípio Final

> O Revon Studio CRM não deve parecer um CRM tradicional.  
> Deve parecer um produto premium criado pela Revon Studio.  
>  
> A sensação desejada é:  
> **"Existe inteligência acontecendo por trás de cada relacionamento."**

---

*Revon Studio CRM · Brand Guidelines v1.0 · Junho 2026*  
*Dúvidas: pedro@revonlabs.com.br*
