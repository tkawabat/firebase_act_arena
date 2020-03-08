## functions
* init
    * FirebaseのWebUI上でサービスアカウントの秘密鍵を生成して、functions以下に置く

* deploy

```
$ firebase use [develop/production]
$ firebase deploy
```

* test

```
* npm test
```

## cli実行方法

* アリーナ作成

```
$ ts-node src/cli.ts arena -n 4
```

* アリーナ全削除

```
$ ts-node src/cli.ts arena -d
```

* アリーナ台本インポート

```
$ mv /Users/tune/Downloads/アクト・アリーナ台本\ -\ アリーナ\.tsv  work/arenaScenario.tsv
$ ts-node src/cli.ts arenaScenario -f work/arenaScenario.tsv
```

* アリーナ台本全削除

```
$ ts-node src/cli.ts arenaScenario -d
```

* 台本インポート

```
$ mv /Users/tune/Downloads/アクト・アリーナ台本\ -\ 1hourAct\.tsv  work/scenario.tsv
$ ts-node src/cli.ts scenario -f work/scenario.tsv
```

* 台本全削除

```
$ ts-node src/cli.ts scenario -d
```
