# angular-universal-without-cli
Angular Universal app without angular-cli (only own webpack configs)

## Usage
1. `npm i`
1. `npm run build:all` - building all instances of app (wep-app & server-app)
1. `npm run go` - run local server

## THE MOST IMPORTANT FEATURE
Don't use DOM and most popular browser features directly. DOM does not exist on the server. Use Angular-wrappers instead (like a Renderer etc). Also see `src/ssr-dom.polyfills.ts`;

#### How to check SSR?
Get `http://localhost:4000` with `curl` or your favorite rest-client like a Postman. If you will see in response rendered App - you are on the right track!

=====================
# Механизм серверного рендеринга и сборка приложений
## Краткое описание
Приложение которое должно рендериться на сервере почти ничем не отличается от обычного. Самое главное пропустить приложение через специальный движок, например `ngExpressEngine` (если используем nodejs).

## Сборка
### Сборка angular-приложения:

Для приложения у нас должно быть два головных модуля (входные точки в терминологии вэбпака):
- `main.ts` - сборка основного приложения, браузерная часть
- `main.server.ts` - сборка основного приложения для серверного рендеринга


### Сборка express-приложения:

То что мы ранее собрали нужно запустить на сервере. В нашем случае это будет express-сервер (nodejs). Для этого нам нужна еще одна входная точка - `server.ts`

## Детали о входных точках
### main.ts
описывать нет смысла, там все как в обычном приложении.

### main.server.ts

Должен включать в себя модуль приложения для сервера - `AppServerModule`, который в свою очередь имеет довольно простую структуру:
```
    /** Этот модуль должен включать в себя модуль браузерного приложения, вспомогательные модули из @angular/platform-server и ModuleMapLoaderModule для подгрузки асинхронных модулей */
    
    @NgModule({
      imports: [
        // The AppServerModule should import your AppModule followed
        // by the ServerModule from @angular/platform-server.
        AppModule,
        ServerModule,
        ModuleMapLoaderModule,
        ServerTransferStateModule,
      ],
      // Since the bootstrapped component is not inherited from your
      // imported AppModule, it needs to be repeated here.
      bootstrap: [AppComponent],
    })
    export class AppServerModule {}

```

### server.ts
```    /** Самые важные части указаны ниже */
    const {AppServerModuleNgFactory, LAZY_MODULE_MAP} = require('./dist/server/main');
    
    /**
    после сборки main.server.ts у нас есть скомпилированные файлы. Наша задача передать AppServerModule в движок серверного рендера - ngExpressEngine. Так как компилировали мы в АОТ (можно не использовать АОТ, но предпочтительнее использовать), то в движок нам надо прокинуть NgFactory. Чтобы работала "ленивая подгрузка" модулей нам также надо добавить в провайдеры LAZY_MODULE_MAP
    */
    
    app.engine('html', ngExpressEngine({
      bootstrap: AppServerModuleNgFactory,
      providers: [
        provideModuleMap(LAZY_MODULE_MAP)
      ]
    }));
    
    
    /** Возможно более понятна будет эта запись движка серверного рендера - записи по своим задачам индентичны. Эту запись используют для более гибкого управления серверным рендерингом. Здесь мы видим, что главная функция renderModuleFactory принимает на вход какой-то модуль, урл, а на выходе отдает отрендеренный html */
    
    app.engine('html', (_, options, callback) => {
      renderModuleFactory(AppServerModuleNgFactory, {
        // Our index.html
        document: template,
        url: options.req.url,
        // DI so that we can get lazy-loading to work differently (since we need it to just instantly render it)
        extraProviders: [
          provideModuleMap(LAZY_MODULE_MAP)
        ]
      }).then(html => {
        callback(null, html);
      });
    });
    
    // Остальное содержание server.ts думаю нет смысла разбирать, там стандартные для express-приложения вещи
```

`ngExpressEngine` это обертка над universal's `renderModuleFactory` функцией которая преобразует запросы клиента в страницы, которые отрендерит сервер. Первый параметр - это `AppServerModule` - прослойка между серверным рендером и обычным приложением, второй параметр - провайдеры, зависимости дополнительно необходимые для запуска приложения на сервере. 

в `ngExpressEngine` можно передавать и обычный ангуляр-модуль, собранный в JIT, AOT тут необязателен, главное - передать модуль, с которого начнется инициализация приложения (bootstrap). С АОТ приложение будет работать быстрее, поэтому этот способ является предпочтительным

## Настройки webpack
Нам нужно собрать:
- основное браузерное приложение
- приложение для серверного рендеринга
- express-приложение

Для каждой сборки - свои конфиги
Для того чтобы работали сорсмапы нужно прописать резолв следующим образом: 

```resolve: { extensions: ['.ts', '.js'] } // ts перед js```

### webpack.config.app.js
Конфига для сборки браузерного приложения. Тут все стандартно, единственное, если собирать в АОТ, то `ts` нужно собирать с помощью лоадера `@ngtools/webpack` и  `AngularCompilerPlugin`


### webpack.config.ssr.js
После того как мы собрали бразуерное приложение, нам нужно собрать приложение для сервера. Здесь есть особенности (возможно не критические, надо дополнительно проверить):
- `AngularCompilerPlugin` нужно чуть тоньше настроить чем раньше: установить `platform: 1` и `skipCodeGeneration: false` 
- в основной секции конфиги прописать это: 
```    externals: [nodeExternals()],
    node: {
      __filename: true,
      __dirname: true
    },
    target: 'node',
```

### webpack.config.server.js

Собранное для сервера приложение нужно использовать для сборки express-приложения. Важные части:
```
    externals: [/(node_modules|main\..*\.js)/],
    target: 'node',
    {
      // Mark files inside `@angular/core` as using SystemJS style dynamic imports.
      // Removing this will cause deprecation warnings to appear.
      test: /(\\|\/)@angular(\\|\/)core(\\|\/).+\.js$/,
      parser: { system: true },
    },
```

### Настройки typescript
Здесь важно разделить конфиги на основную часть и дочерние:
- `tsconfig.ts` - основная часть
- `tsconfig.app.ts` - браузерное приложение
- `tsconfig.server.ts` - серверное приложение

Важно задавать тип модулей в секции `compilerOptions`:
- для браузера это `es2015`
- для сервера это `commonjs`

Также важно явно указать какие файлы будем собирать в секции `include`

## Итого
Чтобы собрать полноценное приложение с серверным рендерингом нам надо по порядку собрать:
- браузерное приложение
- серверное приложение
- express-приложение (содержит в себе серверное приложение и express-сервер)

### Нам важны все три сборки:
- `app` - собирает обычное приложение в папку browser, она потом служит нам в кач-ве хранилища шаблонов, для движка шаблонов `ngExpressEngine` (тут все как с другими движками шаблонов в Express: `https://metanit.com/web/nodejs/4.7.php` )
- `ssr` - собирает приложение для сервера
- `server` - собрает express-приложение, которое: а) использует серверное приложение и б) обычное приложение в кач-ве шаблонов ну и сам express-сервер
