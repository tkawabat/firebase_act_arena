## functions
* init
    * FirebaseのWebUI上でサービスアカウントの秘密鍵を生成して、functions以下に置く

* deploy

```
$ firebase use [develop/production]
$ firebase deploy
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

* 台本インポート

```
$ cp /Users/tune/Downloads/アクト・アリーナ台本\ -\ シート1\.tsv  work/scenario.tsv
$ ts-node src/cli.ts scenario -f work/scenario.tsv
```

* 台本全削除

```
$ ts-node src/cli.ts scenario -d
```
