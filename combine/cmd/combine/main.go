package main

import (
	"fmt"
	"io"
	"io/fs"
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"

	"github.com/fsnotify/fsnotify"
)

func copy(src, dest string) error {
	fmt.Printf("Copy %v to %v\n", src, dest)
	srcStat, err := os.Stat(src)

	if err != nil || !srcStat.Mode().IsRegular() {
		return err
	}

	srcFile, err := os.Open(src)
	if err != nil {
		return err
	}
	defer srcFile.Close()

	destFile, err := os.Create(dest)
	if err != nil {
		return err
	}
	defer destFile.Close()

	_, err = io.Copy(destFile, srcFile)

	return err
}

func copyAll(src, dest string) error {
	files, err := os.ReadDir(src)
	if err != nil {
		return err
	}

	for _, file := range files {
		if err = copy(filepath.Join(src, file.Name()), filepath.Join(dest, file.Name())); err != nil {
			return err
		}
	}

	return nil
}

func embedFilesInTemplate(template string, path string, blob string, placeholder string) (string, error) {
	err := filepath.Walk(path, func(path string, info fs.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if info.IsDir() {
			return nil
		}

		if matched, err := filepath.Match(blob, filepath.Base(path)); err != nil {
			return err
		} else if matched {
			tsxData, err := ioutil.ReadFile(path)
			if err != nil {
				return err
			}
			template = strings.ReplaceAll(template, placeholder, string(tsxData)+"\n\n"+placeholder)
		}
		return nil
	})

	if err != nil {
		return "", err
	}

	template = strings.ReplaceAll(template, placeholder, "")

	return template, nil
}

func build() error {
	template, err := ioutil.ReadFile("./index.html")
	if err != nil {
		return err
	}

	stringTemplate := string(template)
	stringTemplate, err = embedFilesInTemplate(stringTemplate, "./tsx", "*.tsx", "/*{{tsx}}*/")
	if err != nil {
		return err
	}

	if err = os.MkdirAll("./build", os.ModePerm); err != nil {
		return err
	}

	if err = ioutil.WriteFile("./build/index.html", []byte(stringTemplate), fs.ModePerm); err != nil {
		return err
	}

	if err = copyAll("./deps", "./build"); err != nil {
		return err
	}

	return nil
}

func main() {
	doneCh := make(chan struct{})

	if err := build(); err != nil {
		panic(err)
	}
	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		panic(err)
	}
	defer watcher.Close()

	go func() {
		for {
			select {
			case event := <-watcher.Events:
				fmt.Println(event)
				if err := build(); err != nil {
					panic(err)
				}
			case err := <-watcher.Errors:
				if err != nil {
					doneCh <- struct{}{}
					panic(err)
				}
			}
		}
	}()

	if err = watcher.Add(filepath.Join(".", "tsx")); err != nil {
		panic(err)
	}
	fmt.Println("Watching ./tsx for changes")

	if err = watcher.Add(filepath.Join(".", "deps")); err != nil {
		panic(err)
	}
	fmt.Println("Watching ./deps for changes")

	if err = watcher.Add(filepath.Join(".", "index.html")); err != nil {
		panic(err)
	}
	fmt.Println("Watching index.html for changes")

	<-doneCh
}
