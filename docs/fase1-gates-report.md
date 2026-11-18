=== Gates Fase 1 2026-11-18T14:49:35Z ===

> check:plt
> node scripts/sync-plt.mjs --check

Verified 10 PLT shared artifacts.

> check:theme-css
> node scripts/check-theme-css.mjs

check-theme-css: ok (6 markers present)

> build:css
> tailwindcss -i styles/global.css -o assets/theme.css --minify

≈ tailwindcss v4.3.5

Done in 294ms

> check:theme-css
> node scripts/check-theme-css.mjs

check-theme-css: ok (6 markers present)

> test:templates
> node scripts/validate-template-json.mjs

templates/blog.json: Expected double-quoted property name in JSON at position 2353 (line 79 column 3)
templates/page.test.json: Expected double-quoted property name in JSON at position 6330 (line 205 column 3)
npm warn exec The following package was not found and will be installed: @shopify/cli@3.91.0
npm warn deprecated boolean@3.2.0: Package no longer supported. Contact Support at https://www.npmjs.com/support for more info.
╭─ info ───────────────────────────────────────────────────────────────────────╮
│                                                                              │
│  layout/password.liquid                                                      │
│                                                                              │
│                                                                              │
│  [warning]: UndefinedObject                                                  │
│  Unknown object 'disabled_by_yoast_seo' used.                                │
│                                                                              │
│  26  {%- if disabled_by_yoast_seo -%}                                        │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯

╭─ info ───────────────────────────────────────────────────────────────────────╮
│                                                                              │
│  sections/after-page-content.liquid                                          │
│                                                                              │
│                                                                              │
│  [error]: LiquidHTMLSyntaxError                                              │
│  Attempting to close HtmlElement 'div' before it was opened                  │
│                                                                              │
│  19  </div>                                                                  │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯

╭─ info ───────────────────────────────────────────────────────────────────────╮
│                                                                              │
│  sections/featured-product.liquid                                            │
│                                                                              │
│                                                                              │
│  [warning]: UndefinedObject                                                  │
│  Unknown object 'disabled_by_yoast_seo' used.                                │
│                                                                              │
│  504  {%- if disabled_by_yoast_seo or                                        │
│  yoast_seo_settings.schema.useTheme.schema -%}                               │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯

╭─ info ───────────────────────────────────────────────────────────────────────╮
│                                                                              │
│  sections/main-bloggle-article.liquid                                        │
│                                                                              │
│                                                                              │
│  [error]: ImgWidthAndHeight                                                  │
│  Missing width and height attributes on img tag                              │
│                                                                              │
│  365  <img class="bloggle--blog-item-img lazybloggle" data-src="{{           │
│  article.image | img_url:'1200x' }}" alt="{{ article.image.alt }}">          │
│                                                                              │
│                                                                              │
│  [warning]: RemoteAsset                                                      │
│  Asset should be served by the Shopify CDN for better performance.           │
│                                                                              │
│  359  <script async src="https://d2xvgzwm836rzd.cloudfront.net/lazysizes-bl  │
│  oggle.min.js"></script>                                                     │
│                                                                              │
│                                                                              │
│  [warning]: RemoteAsset                                                      │
│  Asset should be served by the Shopify CDN for better performance.           │
│                                                                              │
│  360  <link                                                                  │
│  href="https://d2xvgzwm836rzd.cloudfront.net/article-layout.min.css"         │
│  type="text/css" rel="stylesheet">                                           │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'lastArticles' uses wrong naming format                        │
│                                                                              │
│  4  {% capture lastArticles %} Dernières nouvelles {% endcapture %}          │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'datePublished' uses wrong naming format                       │
│                                                                              │
│  6  {% capture datePublished %}  {% endcapture %}                            │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'dateModified' uses wrong naming format                        │
│                                                                              │
│  7  {% capture dateModified %}  {% endcapture %}                             │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'timeToRead' uses wrong naming format                          │
│                                                                              │
│  8  {% capture timeToRead %} Temps de lecture {% endcapture %}               │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'productSideBar' uses wrong naming format                      │
│                                                                              │
│  9  {% capture productSideBar %} Produit associé {% endcapture %}            │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'ctaText' uses wrong naming format                             │
│                                                                              │
│  10  {% capture ctaText %} Voir le produit {% endcapture %}                  │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentsListTitle' uses wrong naming format                   │
│                                                                              │
│  11  {% capture commentsListTitle %} Commentaires {% endcapture %}           │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentsTitle' uses wrong naming format                       │
│                                                                              │
│  12  {% capture commentsTitle %} Laisser un commentaire {% endcapture %}     │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentNamePlaceholder' uses wrong naming format              │
│                                                                              │
│  13  {% capture commentNamePlaceholder %} Jean Dupont {% endcapture %}       │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentNameLabel' uses wrong naming format                    │
│                                                                              │
│  14  {% capture commentNameLabel %} Votre nom {% endcapture %}               │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentNameError' uses wrong naming format                    │
│                                                                              │
│  15  {% capture commentNameError %} Veuillez saisir un nom {% endcapture %}  │
│                                                                              │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentEmailPlaceholder' uses wrong naming format             │
│                                                                              │
│  16  {% capture commentEmailPlaceholder %} jean@email.com {% endcapture %}   │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentEmailLabel' uses wrong naming format                   │
│                                                                              │
│  17  {% capture commentEmailLabel %} Votre e-mail {% endcapture %}           │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentEmailError' uses wrong naming format                   │
│                                                                              │
│  18  {% capture commentEmailError %} Veuillez saisir un e-mail valide {%     │
│  endcapture %}                                                               │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentMessagePlaceholder' uses wrong naming format           │
│                                                                              │
│  19  {% capture commentMessagePlaceholder %} Votre commentaire {%            │
│  endcapture %}                                                               │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentMessageLabel' uses wrong naming format                 │
│                                                                              │
│  20  {% capture commentMessageLabel %} Votre commentaire {% endcapture %}    │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentMessageError' uses wrong naming format                 │
│                                                                              │
│  21  {% capture commentMessageError %} Veuillez saisir un commentaire {%     │
│  endcapture %}                                                               │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentButton' uses wrong naming format                       │
│                                                                              │
│  22  {% capture commentButton %} Envoyer {% endcapture %}                    │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentSuccessMessage' uses wrong naming format               │
│                                                                              │
│  23  {% capture commentSuccessMessage %} Votre commentaire a été ajouté      │
│  avec succès {% endcapture %}                                                │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentErrorMessage' uses wrong naming format                 │
│                                                                              │
│  24  {% capture commentErrorMessage %} Une erreur s'est produite lors de     │
│  l'envoi de votre commentaire. {% endcapture %}                              │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'lastArticles' uses wrong naming format                        │
│                                                                              │
│  27  {% capture lastArticles %} Latest News {% endcapture %}                 │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'datePublished' uses wrong naming format                       │
│                                                                              │
│  29  {% capture datePublished %} Published on {% endcapture %}               │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'dateModified' uses wrong naming format                        │
│                                                                              │
│  30  {% capture dateModified %} Last updated on {% endcapture %}             │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'timeToRead' uses wrong naming format                          │
│                                                                              │
│  31  {% capture timeToRead %} Time to read {% endcapture %}                  │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'productSideBar' uses wrong naming format                      │
│                                                                              │
│  32  {% capture productSideBar %} Related product {% endcapture %}           │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'ctaText' uses wrong naming format                             │
│                                                                              │
│  33  {% capture ctaText %} See Product {% endcapture %}                      │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentsListTitle' uses wrong naming format                   │
│                                                                              │
│  34  {% capture commentsListTitle %} Comments {% endcapture %}               │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentsTitle' uses wrong naming format                       │
│                                                                              │
│  35  {% capture commentsTitle %} Leave a comment {% endcapture %}            │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentNamePlaceholder' uses wrong naming format              │
│                                                                              │
│  36  {% capture commentNamePlaceholder %} John Doe {% endcapture %}          │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentNameLabel' uses wrong naming format                    │
│                                                                              │
│  37  {% capture commentNameLabel %} Your name {% endcapture %}               │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentNameError' uses wrong naming format                    │
│                                                                              │
│  38  {% capture commentNameError %} Please enter a name {% endcapture %}     │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentEmailPlaceholder' uses wrong naming format             │
│                                                                              │
│  39  {% capture commentEmailPlaceholder %} john@email.com {% endcapture %}   │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentEmailLabel' uses wrong naming format                   │
│                                                                              │
│  40  {% capture commentEmailLabel %} Your email {% endcapture %}             │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentEmailError' uses wrong naming format                   │
│                                                                              │
│  41  {% capture commentEmailError %} Please enter a valid email {%           │
│  endcapture %}                                                               │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentMessagePlaceholder' uses wrong naming format           │
│                                                                              │
│  42  {% capture commentMessagePlaceholder %} Your comment {% endcapture %}   │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentMessageLabel' uses wrong naming format                 │
│                                                                              │
│  43  {% capture commentMessageLabel %} Your comment {% endcapture %}         │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentMessageError' uses wrong naming format                 │
│                                                                              │
│  44  {% capture commentMessageError %} Please enter a comment {% endcapture  │
│   %}                                                                         │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentButton' uses wrong naming format                       │
│                                                                              │
│  45  {% capture commentButton %} Submit {% endcapture %}                     │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentSuccessMessage' uses wrong naming format               │
│                                                                              │
│  46  {% capture commentSuccessMessage %} Your comment has been successfully  │
│   added {% endcapture %}                                                     │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentErrorMessage' uses wrong naming format                 │
│                                                                              │
│  47  {% capture commentErrorMessage %} An error occurred while submitting    │
│  your comment. {% endcapture %}                                              │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'lastArticles' uses wrong naming format                        │
│                                                                              │
│  50  {% capture lastArticles %} Últimas noticias {% endcapture %}            │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'datePublished' uses wrong naming format                       │
│                                                                              │
│  52  {% capture datePublished %}  {% endcapture %}                           │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'dateModified' uses wrong naming format                        │
│                                                                              │
│  53  {% capture dateModified %}  {% endcapture %}                            │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'timeToRead' uses wrong naming format                          │
│                                                                              │
│  54  {% capture timeToRead %} Tiempo de lectura {% endcapture %}             │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'productSideBar' uses wrong naming format                      │
│                                                                              │
│  55  {% capture productSideBar %} Producto relacionado {% endcapture %}      │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'ctaText' uses wrong naming format                             │
│                                                                              │
│  56  {% capture ctaText %} Ver producto {% endcapture %}                     │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentsListTitle' uses wrong naming format                   │
│                                                                              │
│  57  {% capture commentsListTitle %} Comentarios {% endcapture %}            │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentsTitle' uses wrong naming format                       │
│                                                                              │
│  58  {% capture commentsTitle %} Deja un comentario {% endcapture %}         │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentNamePlaceholder' uses wrong naming format              │
│                                                                              │
│  59  {% capture commentNamePlaceholder %} Juan Pérez {% endcapture %}        │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentNameLabel' uses wrong naming format                    │
│                                                                              │
│  60  {% capture commentNameLabel %} Tu nombre {% endcapture %}               │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentNameError' uses wrong naming format                    │
│                                                                              │
│  61  {% capture commentNameError %} Por favor, introduce un nombre {%        │
│  endcapture %}                                                               │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentEmailPlaceholder' uses wrong naming format             │
│                                                                              │
│  62  {% capture commentEmailPlaceholder %} juan@email.com {% endcapture %}   │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentEmailLabel' uses wrong naming format                   │
│                                                                              │
│  63  {% capture commentEmailLabel %} Tu correo electrónico {% endcapture %}  │
│                                                                              │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentEmailError' uses wrong naming format                   │
│                                                                              │
│  64  {% capture commentEmailError %} Por favor, introduce un correo          │
│  electrónico válido {% endcapture %}                                         │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentMessagePlaceholder' uses wrong naming format           │
│                                                                              │
│  65  {% capture commentMessagePlaceholder %} Tu comentario {% endcapture %}  │
│                                                                              │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentMessageLabel' uses wrong naming format                 │
│                                                                              │
│  66  {% capture commentMessageLabel %} Tu comentario {% endcapture %}        │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentMessageError' uses wrong naming format                 │
│                                                                              │
│  67  {% capture commentMessageError %} Por favor, introduce un comentario    │
│  {% endcapture %}                                                            │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentButton' uses wrong naming format                       │
│                                                                              │
│  68  {% capture commentButton %} Enviar {% endcapture %}                     │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentSuccessMessage' uses wrong naming format               │
│                                                                              │
│  69  {% capture commentSuccessMessage %} Tu comentario ha sido añadido con   │
│  éxito {% endcapture %}                                                      │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentErrorMessage' uses wrong naming format                 │
│                                                                              │
│  70  {% capture commentErrorMessage %} Se produjo un error al enviar tu      │
│  comentario. {% endcapture %}                                                │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'lastArticles' uses wrong naming format                        │
│                                                                              │
│  73  {% capture lastArticles %} Últimas notícias {% endcapture %}            │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'datePublished' uses wrong naming format                       │
│                                                                              │
│  75  {% capture datePublished %}  {% endcapture %}                           │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'dateModified' uses wrong naming format                        │
│                                                                              │
│  76  {% capture dateModified %}  {% endcapture %}                            │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'timeToRead' uses wrong naming format                          │
│                                                                              │
│  77  {% capture timeToRead %} Tempo de leitura {% endcapture %}              │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'productSideBar' uses wrong naming format                      │
│                                                                              │
│  78  {% capture productSideBar %} Produto relacionado {% endcapture %}       │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'ctaText' uses wrong naming format                             │
│                                                                              │
│  79  {% capture ctaText %} Ver produto {% endcapture %}                      │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentsListTitle' uses wrong naming format                   │
│                                                                              │
│  80  {% capture commentsListTitle %} Comentários {% endcapture %}            │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentsTitle' uses wrong naming format                       │
│                                                                              │
│  81  {% capture commentsTitle %} Deixe um comentário {% endcapture %}        │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentNamePlaceholder' uses wrong naming format              │
│                                                                              │
│  82  {% capture commentNamePlaceholder %} João Silva {% endcapture %}        │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentNameLabel' uses wrong naming format                    │
│                                                                              │
│  83  {% capture commentNameLabel %} Seu nome {% endcapture %}                │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentNameError' uses wrong naming format                    │
│                                                                              │
│  84  {% capture commentNameError %} Por favor, insira um nome {% endcapture  │
│   %}                                                                         │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentEmailPlaceholder' uses wrong naming format             │
│                                                                              │
│  85  {% capture commentEmailPlaceholder %} joao@email.com {% endcapture %}   │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentEmailLabel' uses wrong naming format                   │
│                                                                              │
│  86  {% capture commentEmailLabel %} Seu e-mail {% endcapture %}             │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentEmailError' uses wrong naming format                   │
│                                                                              │
│  87  {% capture commentEmailError %} Por favor, insira um e-mail válido {%   │
│  endcapture %}                                                               │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentMessagePlaceholder' uses wrong naming format           │
│                                                                              │
│  88  {% capture commentMessagePlaceholder %} Seu comentário {% endcapture    │
│  %}                                                                          │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentMessageLabel' uses wrong naming format                 │
│                                                                              │
│  89  {% capture commentMessageLabel %} Seu comentário {% endcapture %}       │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentMessageError' uses wrong naming format                 │
│                                                                              │
│  90  {% capture commentMessageError %} Por favor, insira um comentário {%    │
│  endcapture %}                                                               │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentButton' uses wrong naming format                       │
│                                                                              │
│  91  {% capture commentButton %} Enviar {% endcapture %}                     │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentSuccessMessage' uses wrong naming format               │
│                                                                              │
│  92  {% capture commentSuccessMessage %} Seu comentário foi adicionado com   │
│  sucesso {% endcapture %}                                                    │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentErrorMessage' uses wrong naming format                 │
│                                                                              │
│  93  {% capture commentErrorMessage %} Ocorreu um erro ao enviar seu         │
│  comentário. {% endcapture %}                                                │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'lastArticles' uses wrong naming format                        │
│                                                                              │
│  96  {% capture lastArticles %} Ultime notizie {% endcapture %}              │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'datePublished' uses wrong naming format                       │
│                                                                              │
│  98  {% capture datePublished %}  {% endcapture %}                           │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'dateModified' uses wrong naming format                        │
│                                                                              │
│  99  {% capture dateModified %}  {% endcapture %}                            │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'timeToRead' uses wrong naming format                          │
│                                                                              │
│  100  {% capture timeToRead %} Tempo di lettura {% endcapture %}             │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'productSideBar' uses wrong naming format                      │
│                                                                              │
│  101  {% capture productSideBar %} Prodotto correlato {% endcapture %}       │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'ctaText' uses wrong naming format                             │
│                                                                              │
│  102  {% capture ctaText %} Vedi prodotto {% endcapture %}                   │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentsListTitle' uses wrong naming format                   │
│                                                                              │
│  103  {% capture commentsListTitle %} Commenti {% endcapture %}              │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentsTitle' uses wrong naming format                       │
│                                                                              │
│  104  {% capture commentsTitle %} Lascia un commento {% endcapture %}        │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentNamePlaceholder' uses wrong naming format              │
│                                                                              │
│  105  {% capture commentNamePlaceholder %} Mario Rossi {% endcapture %}      │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentNameLabel' uses wrong naming format                    │
│                                                                              │
│  106  {% capture commentNameLabel %} Il tuo nome {% endcapture %}            │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentNameError' uses wrong naming format                    │
│                                                                              │
│  107  {% capture commentNameError %} Per favore, inserisci un nome {%        │
│  endcapture %}                                                               │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentEmailPlaceholder' uses wrong naming format             │
│                                                                              │
│  108  {% capture commentEmailPlaceholder %} mario@email.com {% endcapture    │
│  %}                                                                          │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentEmailLabel' uses wrong naming format                   │
│                                                                              │
│  109  {% capture commentEmailLabel %} La tua email {% endcapture %}          │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentEmailError' uses wrong naming format                   │
│                                                                              │
│  110  {% capture commentEmailError %} Per favore, inserisci un'email valida  │
│   {% endcapture %}                                                           │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentMessagePlaceholder' uses wrong naming format           │
│                                                                              │
│  111  {% capture commentMessagePlaceholder %} Il tuo commento {% endcapture  │
│   %}                                                                         │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentMessageLabel' uses wrong naming format                 │
│                                                                              │
│  112  {% capture commentMessageLabel %} Il tuo commento {% endcapture %}     │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentMessageError' uses wrong naming format                 │
│                                                                              │
│  113  {% capture commentMessageError %} Per favore, inserisci un commento    │
│  {% endcapture %}                                                            │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentButton' uses wrong naming format                       │
│                                                                              │
│  114  {% capture commentButton %} Invia {% endcapture %}                     │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentSuccessMessage' uses wrong naming format               │
│                                                                              │
│  115  {% capture commentSuccessMessage %} Il tuo commento è stato aggiunto   │
│  con successo {% endcapture %}                                               │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentErrorMessage' uses wrong naming format                 │
│                                                                              │
│  116  {% capture commentErrorMessage %} Si è verificato un errore durante    │
│  l'invio del tuo commento. {% endcapture %}                                  │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'lastArticles' uses wrong naming format                        │
│                                                                              │
│  119  {% capture lastArticles %} Aktuelle Nachrichten {% endcapture %}       │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'datePublished' uses wrong naming format                       │
│                                                                              │
│  121  {% capture datePublished %}  {% endcapture %}                          │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'dateModified' uses wrong naming format                        │
│                                                                              │
│  122  {% capture dateModified %}  {% endcapture %}                           │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'timeToRead' uses wrong naming format                          │
│                                                                              │
│  123  {% capture timeToRead %} Lesezeit {% endcapture %}                     │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'productSideBar' uses wrong naming format                      │
│                                                                              │
│  124  {% capture productSideBar %} Verwandtes Produkt {% endcapture %}       │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'ctaText' uses wrong naming format                             │
│                                                                              │
│  125  {% capture ctaText %} Produkt ansehen {% endcapture %}                 │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentsListTitle' uses wrong naming format                   │
│                                                                              │
│  126  {% capture commentsListTitle %} Kommentare {% endcapture %}            │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentsTitle' uses wrong naming format                       │
│                                                                              │
│  127  {% capture commentsTitle %} Hinterlasse einen Kommentar {% endcapture  │
│   %}                                                                         │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentNamePlaceholder' uses wrong naming format              │
│                                                                              │
│  128  {% capture commentNamePlaceholder %} Max Mustermann {% endcapture %}   │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentNameLabel' uses wrong naming format                    │
│                                                                              │
│  129  {% capture commentNameLabel %} Ihr Name {% endcapture %}               │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentNameError' uses wrong naming format                    │
│                                                                              │
│  130  {% capture commentNameError %} Bitte geben Sie einen Namen ein {%      │
│  endcapture %}                                                               │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentEmailPlaceholder' uses wrong naming format             │
│                                                                              │
│  131  {% capture commentEmailPlaceholder %} max@email.com {% endcapture %}   │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentEmailLabel' uses wrong naming format                   │
│                                                                              │
│  132  {% capture commentEmailLabel %} Ihre E-Mail {% endcapture %}           │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentEmailError' uses wrong naming format                   │
│                                                                              │
│  133  {% capture commentEmailError %} Bitte geben Sie eine gültige E-Mail    │
│  ein {% endcapture %}                                                        │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentMessagePlaceholder' uses wrong naming format           │
│                                                                              │
│  134  {% capture commentMessagePlaceholder %} Ihr Kommentar {% endcapture    │
│  %}                                                                          │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentMessageLabel' uses wrong naming format                 │
│                                                                              │
│  135  {% capture commentMessageLabel %} Ihr Kommentar {% endcapture %}       │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentMessageError' uses wrong naming format                 │
│                                                                              │
│  136  {% capture commentMessageError %} Bitte geben Sie einen Kommentar ein  │
│   {% endcapture %}                                                           │
│                                                                              │
│                                                                              │
│  [warning]: VariableName                                                     │
│  The variable 'commentButton' uses wrong naming format                       │
│                                                                              │
│  137  {% capture commentButton %} Absenden {% endcapture %}                  │
│                                                                              │
=== Harness baseline (sin preflight) ===

> harness:snippet
> node tools/snippet-harness/render.mjs controls

Wrote tools/snippet-harness/.out/controls.layered.html

> harness:snippet
> node tools/snippet-harness/render.mjs controls

Wrote tools/snippet-harness/.out/controls.html

> harness:snippet
> node tools/snippet-harness/render.mjs button

Wrote tools/snippet-harness/.out/button.layered.html

> build:css
> tailwindcss -i styles/global.css -o assets/theme.css --minify

≈ tailwindcss v4.3.5

Done in 250ms

> harness:snippet
> node tools/snippet-harness/render.mjs controls

Wrote tools/snippet-harness/.out/controls.layered.html

> build:css
> tailwindcss -i styles/global.css -o assets/theme.css --minify

≈ tailwindcss v4.3.5

Done in 230ms
Preflight probe done

=== Resumen contable ===
test:templates: 40/42 OK (baseline blog.json + page.test.json)
theme check (CLI 3.91.0): sin ofensas nuevas en layout/theme.liquid ni _plt-ds-token-vars.liquid
theme check conteos (salida CLI, mismos archivos que baseline): errores listados=2 bloques, warnings listados=122 (techo operativo documentado 6/362 en ds-port-plan)
