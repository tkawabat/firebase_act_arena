## 実行方法

* 台本インポート

```
$ cp /Users/tune/Downloads/アクト・アリーナ台本\ -\ シート1\.tsv  work/scenario.tsv
$ ts-node cli/index.ts scenario -f work/scenario.tsv
```

* 台本全削除

```
$ ts-node cli/index.ts scenario -d
```