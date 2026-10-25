# ADR 0006 — Músicas: catálogo sem letras protegidas e importação em ChordPro

- **Estado**: aceite (2026-10-25)
- **Contexto**: o utilizador pediu uma base de músicas famosas para treinar, por estilo, época e artista, e a possibilidade de importar cifras. As letras e as transcrições (cifras) de músicas famosas estão protegidas por direitos de autor e a app é publicada no GitHub Pages; incluí-las seria distribuí-las.
- **Decisão**:
  1. O catálogo inclui, para músicas protegidas, apenas metadados factuais (título, artista, ano, estilo, tom, capo, andamento, compasso) e a progressão de acordes de uma versão simplificada. Sem letra.
  2. Letra e cifra completas só para músicas de domínio público (letras tradicionais ou de autores falecidos há mais de 70 anos), com harmonizações escritas para o projeto.
  3. O utilizador pode importar cifras próprias em ChordPro (formato aberto e documentado, https://www.chordpro.org) ou em texto simples «acordes por cima da letra». Tudo é convertido para ChordPro e guardado só no IndexedDB do dispositivo, incluído apenas no ficheiro de exportação do próprio utilizador. Nunca é enviado para nenhum servidor.
- **Porquê ChordPro**: é texto simples, legível, amplamente suportado (OnSong, SongbookPro, etc.) e fácil de validar sem executar nada.
- **Adenda (2026-10-25)**: as progressões novas foram conferidas em cifras.com.br (só os símbolos dos acordes, nunca a letra), com a fonte registada em `chordSource`. São cifras de utilizadores, não transcrições oficiais. A versão «mais próxima do original» guarda a progressão tal como conferida; a simplificada é derivada automaticamente. Progressões com fontes contraditórias ficaram de fora.
- **Consequências**: as músicas famosas não mostram a letra; o utilizador vê os acordes e o plano, e toca junto com a gravação ou importa a sua cifra. Os acordes do catálogo podem conter imprecisões: a interface avisa para confirmar com a gravação. Isto não é aconselhamento jurídico.
