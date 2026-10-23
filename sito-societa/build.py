# Genera sito-singolo.html (stile, font e script inclusi) a partire dai file separati.
h = open('index.html', encoding='utf-8').read()
h = h.replace('<link rel="stylesheet" href="fonts.css">\n<link rel="stylesheet" href="style.css">',
              '<style>\n' + open('fonts.css', encoding='utf-8').read() + '\n' + open('style.css', encoding='utf-8').read() + '</style>')
h = h.replace('<script src="app.js" defer></script>', '<script>\n' + open('app.js', encoding='utf-8').read() + '</script>')
open('sito-singolo.html', 'w', encoding='utf-8').write(h)
