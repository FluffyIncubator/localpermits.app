package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/sirupsen/logrus"
)

var port = os.Getenv("PORT")

func main() {

	if len(port) == 0 {
		port = "8080"
	}

	if len(os.Args) < 2 {
		log.Fatal(fmt.Errorf("You need to pass the path to the static file dir."))
	}

	filePath := os.Args[1]

	fs := http.FileServer(http.Dir(filePath))

	SetLogFormat()

	loggedFs := Logger("localpermits.app")(fs)

	http.Handle("/", loggedFs)

	port = fmt.Sprintf(":%s", port)

	log.Printf("Listening on port %s\n", port)

	if err := http.ListenAndServe(port, nil); err != nil {
		log.Fatal(err)
	}
}

func SetLogFormat() {
	logrus.SetFormatter(&logrus.TextFormatter{
		ForceQuote:    true,
		FullTimestamp: true,
		DisableColors: true,
	})
}

func Logger(service string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		fn := func(w http.ResponseWriter, r *http.Request) {

			ip := r.RemoteAddr

			if r.Header.Get("x-forwarded-for") != "" {
				ip = r.Header.Get("x-forwarded-for")
			}

			logrus.WithFields(logrus.Fields{
				"ip":     ip,
				"uri":    r.RequestURI,
				"method": r.Method,
			}).Info(service)
			next.ServeHTTP(w, r)
		}

		return http.HandlerFunc(fn)
	}
}
