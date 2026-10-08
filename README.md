# ReparoHub — landing page

Landing page estática do ReparoHub, preparada em 08/10/2026 para `https://reparohub.com/`. HTML, CSS e JavaScript sem dependências de execução ou build. Marca principal conforme o kit 1.1 do Vault Cockpit; Diodo Desk apresentado como futuro módulo em desenvolvimento.

## Abrir

Prévia nesta máquina: http://127.0.0.1:4387/. O servidor local foi iniciado oculto e limitado a localhost. Para iniciar novamente se necessário:

```powershell
python -m http.server 4387 --bind 127.0.0.1 --directory E:\Sites\reparo-hub
```

`index.html` também abre diretamente no navegador. A persistência de preferências em URLs `file:` depende do navegador.

## Implementação

- `index.html`: hero, fluxo, recursos com três abas e capturas reais, três vídeos, Diodo Desk, origem, FAQ e fechamento.
- `tokens.css` e `themes.css`: cópias sem alteração do kit ReparoHub no vault.
- `styles.css` e `media.css`: layout responsivo e apresentação das capturas e vídeos.
- `theme.js`: restaura escolha de tema antes do CSS, tolerando armazenamento bloqueado.
- `site.js`: Claro / Escuro / Automático, menu móvel e abas acessíveis por teclado.
- `assets/`: símbolos originais, fonte Manrope local com licença, vídeos e capturas. O wordmark é texto em Manrope conforme a assinatura do kit.
- `assets/media/README.md`: seleção e função das mídias na página.
- `qa/browser-check.js`: verificação reproduzível pelo Playwright CLI.

Tema inicial automático; escolher claro ou escuro grava somente a preferência local. Voltar ao automático remove a escolha fixa. Nenhum formulário, analytics, cookie ou serviço externo foi adicionado.

## Conteúdo e limites

O hero contém uma composição ilustrativa identificada. Nas abas, as capturas são da versão atual do ReparoHub com dados de teste. O Diodo Desk aparece em capturas reais da ferramenta em desenvolvimento. Os três vídeos tocam sob demanda, com controles nativos e sem autoplay. Há somente uma animação breve de entrada no hero, desativada por `prefers-reduced-motion`.

O canal comercial não consta no kit e foi solicitado ao proprietário. Enquanto não for definido, os CTAs levam à seção de recursos. Para ativar contato, ajustar os links `data-contact-link`, seus rótulos e a copy de fechamento. Não usar contatos da GC Tech por inferência.

A raiz do repositório é a origem do GitHub Pages. `CNAME` vincula `reparohub.com`; `robots.txt`, `sitemap.xml` e canonical apontam para o mesmo endereço. A página é pública e indexável quando o domínio resolver. Nenhum dos aplicativos ReparoHub/Diodo Desk é alterado por este site.

## Verificar

Com a prévia local iniciada:

```powershell
npx --yes --package @playwright/cli playwright-cli -s=reparohub open http://127.0.0.1:4387 --browser chrome
npx --yes --package @playwright/cli playwright-cli -s=reparohub run-code --filename=qa/browser-check.js
& E:\Sites\site-builder\engine\validate-site.ps1 -Slug reparo-hub -Profile release
```

Em 08/10/2026: 46 verificações do navegador passaram; os três vídeos tiveram metadados decodificados no Chrome. O relatório detalhado fica no registro local da fábrica de sites.

Fontes e decisões estão no briefing e manifesto locais da fábrica de sites (`E:\Sites\site-builder\sites\reparo-hub\`).
