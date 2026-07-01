'use strict';

(() => {
  const root = typeof window !== 'undefined' ? window : globalThis;
  const ANIMAL_INFO_LAYOUT = {
    id: 'animal-info-responsive-manor-ranch-2026-07',
    panelWidth: 501,
    panelHeight: 333,
    maxPanelWidth: 760,
    maxPanelHeight: 560,
    anchor: {
      xOffset: 190,
      yOffset: 3,
      width: 125,
      height: 22,
      data: 'MlBjADJQYwAyUGMAMlBjADJQYwAyUGMAMlBjADJQYwAyUGMAMlBjADJQYwAyUGMAMlBjADJQYwAyUGMAMlBjADJQYwAyUGMAMlBjADJQYwAyUGMAMlBjADJQYwAyUGMAMlBjADJQYwAyUGMAMlBjADJQYwAyUGMAMlBjADJQYwAyUGMAMlBjADJQYwAyUGMAMlBjADJQYwAyUGMAMlBjADJQYwAyUGMAMlBjADJQYwAyUGMAMlBjADJQYwAyUGMAMlBjADJQYwAyUGMAMlBjADJQYwAyUGMAMlBjADJQYwAyUGMAMlBjADJQYwAyUGMAMlBjADJQYwAyUGMAMlBjADJQYwAyUGMAMlBjADJQYwAyUGMAMlBjADJQYwAyUGMAMlBjADJQYwAyUGMAMlBjADJQYwAyUGMAMlBjADJQYwAyUGMAMlBjADJQYwAyUGMAMlBjADJQYwAyUGMAMlBjADJQYwAyUGMAMlBjADJQYwAyUGMAMlBjADJQYwAyUGMAMlBjADJQYwAyUGMAMlBjADJQYwAyUGMAMlBjADJQYwAyUGMAMlBjADJQYwAyUGMAMlBjADJQYwAyUGMAMlBjADJQYwAyUGMAMlBjADJQYwAyUGMAMlBjADJQYwAyUGMAMlBjADJQYwAyUGMAMlBjADJQYwAmPU0AJj1NACY9TQAmPU0AJj1NACY9TQAmPU0AJj1NACY9TQAmPU0AJj1NACY9TQAmPU0AJj1NACY9TQAmPU0AJj1NACY9TQAmPU0AJj1NACY9TQAmPU0AJj1NACY9TQAmPU0AJj1NACY9TQAmPU0AJj1NACY9TQAmPU0AJj1NACY9TQAmPU0AJj1NACY9TQAmPU0AJj1NACY9TQAmPU0AJj1NACY9TQAmPU0AJj1NACY9TQAmPU0AJj1NACY9TQAmPU0AJj1NACY9TQAmPU0AJj1NACY9TQAmPU0AJj1NACY9TQAmPU0AJj1NACY9TQAmPU0AJj1NACY9TQAmPU0AJj1NACY9TQAmPU0AJj1NACY9TQAmPU0AJj1NACY9TQAmPU0AJj1NACY9TQAmPU0AJj1NACY9TQAmPU0AJj1NACY9TQAmPU0AJj1NACY9TQAmPU0AJj1NACY9TQAmPU0AJj1NACY9TQAmPU0AJj1NACY9TQAmPU0AJj1NACY9TQAmPU0AJj1NACY9TQAmPU0AJj1NACY9TQAmPU0AJj1NACY9TQAmPU0AJj1NACY9TQAmPU0AJj1NACY9TQAmPU0AJj1NACY9TQAmPU0AJj1NACY9TQAmPU0AJj1NACY9TQAmPU0AJj1NACY9TQAmPU0AJj1NABUYGwAVGBsAFBcbABQXGwAUFxsAFBccABQXHAAUFxwAFBgcABUYHAAVGBwAFRgcABUYHAAUGBwAFRgcABUYHAAVGBwAFRgcABUYHAAVGBwAFRgcABUYHQAVGBwAFBcbABQXGwAUFxsAFBcbABQXGwAVGB0AFRccABQXGwAUFxsAFBcbABQXGwAVFxsAFBcbABUXGwAUFxsAFBcbABQXGwAUFxsAFBcbABQXGwAVFxsAFBcbABQXGwAUFxsAFBcbABQXGwAUFxsAFBcbABQXGwAUFxsAFBcbABQXGwAUFxsAFBcbABQXGwAUFxsAFBcbABQXGwAUFxsAFBcbABQXGwAVGBsAFRgbABQXGwAUFxsAFBcbABQXHAAUFxwAFBccABQYHAAVGBwAFRgcABUYHAAVGBwAFBgcABUYHAAVGBwAFRgcABUYHAAVGBwAFRgcABUYHAAVGB0AFRgcABQXGwAUFxsAFBcbABQXGwAUFxsAFRgdABUXHAAUFxsAFBcbABQXGwAUFxsAFRcbABQXGwAVFxsAFBcbABQXGwAUFxsAFBcbABQXGwAUFxsAFRcbABQXGwAUFxsAFBcbABQXGwAUFxsAFBcbABQXGwAUFxsAFBcbABQXGwAUFxsAFBcbABQXGwAUFxsAFBcbABQXGwAUFxsAHyMnAB4kJwAjKC4AJSsuACMqLQAlKi4AIyguACUqLgAjKy4AJSsuACQqLgAlKi4AJSsuACUrLgAjKi0AIyouACMnLQAjJy0AISYqACEmKwAgJSkAICUpACInLQAkKCsAIicqACAnKgAiJioAICYqACQpLQAkKS4AJSouACImKgAhJSkAISYpACMoLQAlKi0AIigrACUqLgAjKC4AJSouACMqLQAkKSwAIigsACMoKwAjKSwAJCktACEnKwAgJSkAICQoACAlKAAhJikAIScpACIpLQAiJioAIigsACIpLAAiKSwAIiksACInKQAhJykAIicrACQpLgAjKCwAICQoAB8jJwAeJCcAIyguACUrLgAjKi0AJSouACMoLgAlKi4AIysuACUrLgAkKi4AJSouACUrLgAlKy4AIyotACMqLgAjJy0AIyctACEmKgAhJisAICUpACAlKQAiJy0AJCgrACInKgAgJyoAIiYqACAmKgAkKS0AJCkuACUqLgAiJioAISUpACEmKQAjKC0AJSotACIoKwAlKi4AIyguACUqLgAjKi0AJCksACIoLAAjKCsAIyksACQpLQAhJysAICUpACAkKAAgJSgAISYpACEnKQAiKS0AIiYqACIoLAAiKSwAIiksACIpLAAiJykAIScpACInKwAjKS0AIygrACIkKgAeIiUAHR8iABwgIwAcICMAGiAhABoeIQAaHiEAHB4iABoeIgAaHiIAHR8iABshIgAdISMAHR8jAB0fIgAcHiIAHB4hABseIAAaHB8AHB4jABwhJAAeISUAHSEkAB0gJAAcICIAGx4hABscHwAbHR8AGxwgABseIQAbHSEAGx4iABseIQAbHiEAHB8iABwgIwAbICIAGh4hABoeIQAcHiIAGh4iABoeIgAdHyIAGyEiAB0hIwAdICQAHyElAB8iJgAfIiUAHCAiABodIAAcHiMAGx8iAB4hJQAeIiYAHiElAB0hIwAfIygAIygsACUqLQAlLC8AIyktACMoKwAiJCoAHiIlAB0fIgAcICMAHCAjABogIQAaHiEAGh4hABweIgAaHiIAGh4iAB0fIgAbISIAHSEjAB0fIwAdHyIAHB4iABweIQAbHiAAGhwfABweIwAcISQAHiElAB0hJAAdICQAHCAiABseIQAbHB8AGx0fABscIAAbHiEAGx0hABseIgAbHiEAGx4hABwfIgAcICMAGyAiABoeIQAaHiEAHB4iABoeIgAaHiIAHR8iABshIgAdISMAHSAkAB8hJQAfIiYAHyIlABwgIgAaHSAAHB4jABsfIgAeISUAHiImAB4hJQAdISMAHyMoABodIAAaHSAAGRwgABocIQAaHSAAGh0fABodIQAbHiEAGx0hABseIgAbHiIAHB8jABwfIwAcHyMAHSEkAB4hJQAeIiYAHSEkABsfIgAaHyEAGxwgABwfIwAcHyQAHSAkAB0hJAAdISQAHSAiABsfIgAbHSAAGxwfABscHwAbHB8AGx4iABscHwAbHB8AGxwfABscHwAbHiEAGx8jABseIgAbHSEAGx4iABseIgAcHyMAHB8jABwfIwAdISQAHiElAB4iJgAeIiUAHSIlAB0iJQAcHyMAHB8jABwgJAAdICQAHSEkAB0hJQAdICIAHCAjABsfIwAZGh0AGh8iABodIAAaHSAAGh0gABkcIAAaHCEAGh0gABodHwAaHSEAGx4hABsdIQAbHiIAGx4iABwfIwAcHyMAHB8jAB0hJAAeISUAHiImAB0hJAAbHyIAGh8hABscIAAcHyMAHB8kAB0gJAAdISQAHSEkAB0gIgAbHyIAGx0gABscHwAbHB8AGxwfABseIgAbHB8AGxwfABscHwAbHB8AGx4hABsfIwAbHiIAGx0hABseIgAbHiIAHB8jABwfIwAcHyMAHSEkAB4hJQAeIiYAHiIlAB0iJQAdIiUAHB8jABwfIwAcICQAHSAkAB0hJAAdISUAHSAiABwgIwAbHyMAGx4iABwfIwAcHyMAHB8jABseIgAcHyMAHB8jABwfIwAcHyMAHB8jABweIgAcHyMAHB8jABwgJAAcICQAHSAkAB0hJQAeIyUAHSAkABweIwAdICQAHCAkAB0hJQAdIiUAHSIlAB0iJQAfIyYAHiMmAB0iJQAdICQAGx8jABwfIwAcHyMAHB8jABwfIwAbHSEAGx0hABweIgAcHiIAHB4iABwfIwAcHyMAHB4iABwfIwAcHyMAHCAkABwgJAAdICQAHiIlAB8lKAAdIiUAHSIlAB0hJAAcICQAHiQmAB0iJQAdIiUAHSIlAB8jJgAeIyYAHSIkABwfIwAaHiIAGx4iABseIgAcHyMAHB8jABwfIwAbHiIAHB8jABwfIwAcHyMAHB8jABwfIwAcHiIAHB8jABwfIwAcICQAHCAkAB0gJAAdISUAHiMlAB0gJAAcHiMAHSAkABwgJAAdISUAHSIlAB0iJQAdIiUAHyMmAB4jJgAdIiUAHSAkABsfIwAcHyMAHB8jABwfIwAcHyMAGx0hABsdIQAcHiIAHB4iABweIgAcHyMAHB8jABweIgAcHyMAHB8jABwgJAAcICQAHSAkAB4iJQAfJSgAHSIlAB0iJQAdISQAHCAkAB4kJgAdIiUAHSIlAB0iJQAfIyYAHiMmAB0iJAAcHyMAHB8jABwfIwAcHyMAHB8jABwfIwAcICMAHCAkABwfIwAcHyMAHB8jABwgJAAcICQAHCAkAB0gJAAdIiUAHiImAB4iJgAdIiUAHCAkABwhJAAdIiUAHSIlAB0iJQAdIiUAHSIlAB8jJwAeIyYAHiIlAB4jJQAdICUAHSAkABwgIwAcHyMAHCAjABwfIwAcHyMAHB8jABwgIwAcICQAHB8jABwfIwAcHyMAHCAkABwgJAAdICQAHSAkAB0gJAAeIiUAHyQnAB8jJgAeIiYAHSMlACAjJgAeIiYAHSIlAB0iJQAdIiQAHiIlAB4jJgAeIiUAHiMlABwfJAAcHyMAHB8jABwfIwAcHyMAHB8jABwfIwAcHyMAHCAjABwgJAAcHyMAHB8jABwfIwAcICQAHCAkABwgJAAdICQAHSIlAB4iJgAeIiYAHSIlABwgJAAcISQAHSIlAB0iJQAdIiUAHSIlAB0iJQAfIycAHiMmAB4iJQAeIyUAHSAlAB0gJAAcICMAHB8jABwgIwAcHyMAHB8jABwfIwAcICMAHCAkABwfIwAcHyMAHB8jABwgJAAcICQAHSAkAB0gJAAdICQAHiIlAB8kJwAfIyYAHiImAB0jJQAgIyYAHiImAB0iJQAdIiUAHSIkAB4iJQAeIyYAHiIlAB0fIwAcICQAHCAlABwhJAAcHyMAGx8jABsfIwAcHyMAGyAkAB0gJAAcICQAHSAkABwgJAAcHyMAHCAkAB0iJQAeIyYAHyMmAB4jJQAeIiYAHiMmAB0jJgAeIyYAHSIlAB0iJAAdIiUAHyMmAB4jJgAdIyYAHSIlAB4hJQAdICQAHR8jABwgJAAcICUAHCEkABwfIwAbHyMAGx8jABwfIwAbICQAHSAkABwgJAAdICQAHSAkAB0hJAAdIiUAHSIlAB8jJgAgJCcAICUoAB8jJwAfIycAHyMmAB0iJQAeIiYAHSIlAB0iJAAdIiUAHSIlAB4jJgAdIiUAHiElAB0gJAAdHyMAHCAkABwgJQAcISQAHB8jABsfIwAbHyMAHB8jABsgJAAdICQAHCAkAB0gJAAcICQAHB8jABwgJAAdIiUAHiMmAB8jJgAeIyUAHiImAB4jJgAdIyYAHiMmAB0iJQAdIiQAHSIlAB8jJgAeIyYAHSMmAB0iJQAeISUAHSAkAB0fIwAcICQAHCAlABwhJAAcHyMAGx8jABsfIwAcHyMAGyAkAB0gJAAcICQAHSAkAB0gJAAdISQAHSIlAB0iJQAfIyYAICQnACAlKAAfIycAHyMnAB8jJgAdIiUAHiImAB0iJQAdIiQAHSIlAB0iJQAeIyYAHSIlAB4jJgAeIyYAHiIlAB0hJQAcICMAHB8jABwfIwAcHSIAHB8jABwhJAAdISUAHSIlAB0hJAAdIiUAHSIlAB4iJgAfIycAHyMnAB8jJgAfIycAHyMmAB4jJgAfIycAHiImAB4iJgAeIiUAHSIlAB0iJQAeIiYAHSIlAB0iJQAdIiUAHiMmAB4jJgAeIiUAHSElABwgIwAcHyMAHB8jABwdIgAcHyMAHSImAB0gJAAdISQAHSIlAB0iJQAdIiUAHSIlAB4iJQAgJikAHyMmAB4jJgAeIyYAHyQnAB4jJgAdIiUAHiIlAB4iJQAeIiUAHiMmAB8jJwAdIiUAHSIlAB0iJQAeIyYAHiMmAB4iJQAdISUAHCAjABwfIwAcHyMAHB0iABwfIwAcISQAHSElAB0iJQAdISQAHSIlAB0iJQAeIiYAHyMnAB8jJwAfIyYAHyMnAB8jJgAeIyYAHyMnAB4iJgAeIiYAHiIlAB0iJQAdIiUAHiImAB0iJQAdIiUAHSIlAB4jJgAeIyYAHiIlAB0hJQAcICMAHB8jABwfIwAcHSIAHB8jAB0iJgAdICQAHSEkAB0iJQAdIiUAHSIlAB0iJQAeIiUAICYpAB8jJgAeIyYAHiMmAB8kJwAeIyYAHSIlAB4iJQAeIiUAHiIlAB4jJgAeIiUAHiMmAB8jJgAeIiYAHiMmAB0iJQAdISQAHCEkABwhJAAdISQAHSElAB0iJgAdIyYAHiMmAB4iJgAeIiUAHiIlAB4iJgAfIycAHyMnAE92kv83TFwAHyMmAB8jJgAfIyYAHyMnACQsMwBhlbr/JS0zAB4jJgAeIiUAHiMlACQsMwBVgJ//eb7w/1WAn/8eIyYATnWR/3m+8P9ztOL/O1VoABwgIwAcHiMAHiMlAGCUuv8jLDMAHSIlAB0iJQAdIiUAHSEkADBBTgBVgKD/HyQnAB8kJwAgJigAHyMnAB0iJQAeIiUAHiImAE92kv82TFwAHyQnAB8jJwAeIyUAHiIlAE92kv95vvD/c7Tj/0JhdwAdIiUAHSEkABwhJAAcISQAHSEkAB0hJQAdIiYAHSMmAB4jJgBPdZL/eb7w/3O04v88VmkAHyMnACUtNABhlbr/JS0zAB8jJgAfIyYAHyMmACUtNABVgJ//eb7w/1WAn/8eIyYAT3WR/3m+8P95vvD/banV/3O04/9tqdX/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ISQnACInKgAiJyoAIygsACMpLQAjKCwAIicpAB8kJwAgJSgAICUoACAlKAAhJikAICUoACAlKAAgJSgAHyQnAElshf9ztOP/XJC1/xEYHAAfIycAHyMmAENidwB5vvD/aaXQ/zhRYwBbi63/eb7w/0lykP8tOUQAJSotACInKgAhJCcAKDQ9AGGZwf8AAAAAIyktAEtuh/95vvD/cbHg/z1edgAgJSgAUHeT/3m+8P9Jc5H/GB0gACInKQBekbb/CA0QABEUFQAgJSgAc7Ti/3m+8P9FaoX/IygrAEtth/9ztOP/XZC1/xIZHQAhJigAISUoAERjeQB5vvD/aaXQ/zhRYwBLbYb/eb7w/3m+8P9xsuH/bqrW/3m+8P8sPUkAExYYACAlKAAgJSgAISYpACAlKAAgJSgASmyF/3m+8P9xseD/PV52AB8kJwBbi63/eb7w/0lykP8pNz8AICUoACAlKAAhJSgAJzM8AGGYwf8AAAAAIygtAExviP95vvD/cbHg/z1edgAiJyoAIygsACMpLQAjKCwAJi4zAEJogv9ppdD/bKnU/2egyP9KbYb/EhkdAAkKCwAiJykAIiYpACElKQAgJSgAICUoAB4jJgAfJCYAISYoACMoKwAiJysAIicoACInKQAiJykAISYoACElKAAjKCsAIygsACQpLQAkKS8AIygtACMoLAAiJyoAHiMmACEmKQAhJigAIicpACImKQAhJigAICUoACEmKQAhJigAICUoABETFAACAgMACQoLAB8jJQAhJSgAHyQnABMWFwAAAAAABAUFABUYGgAKDA0AAAAAAAwODwAdISQAIiotACMoKwAjKCwAHyQnAAcICQAjKC0AIygsABIVFgAAAAAAAgMDABIUFQAiJykAEBITAAAAAAANDxAAICUoACAlKAAJCgsAHSIkAB8kJwAfJCcAAgICAAAAAAAQExUAIicrABIVFgACAwMACQoLAB8jJgAgIycAHiQmABQXGQAAAAAABQUGABcbHQATFhgAAAAAAAAAAAACAwMABQUGAAAAAAAaHiEAISYoACInKQAiJikAISYoACAlKAAhJikAEhQVAAAAAAACAgMAERMVACAlKAALDQ0AAAAAAAwOEAAbHyIAHyQnAB8kJwAfJCcAGx8iAAYHCAAeJCYAISYpABIWGAAAAAAAAgMDABMWGAAkKS8AIygtACMoLAAiJyoAHCEjAA8SEwAEBQUABQUFAAcICAASFRYAHyMlACAlKAAgJSgAICUoAB8kJwAfJCcAHyQnAB0hJAAjKCwAIykuACInKwAiJyoAIicqACInKQAhJikAICMnACInKgAjKCoAIygsACInKgAkKS4AIicoACInKgAiJykAIygqACInKgAiJyoAIicqACInKQAiJykAIicqACInKgAlKi4AIyguACMoLQAjKCsAIicpACInKgAhJikAICUoACAlKAAhJikAISYpAB8kJwAfJCcAICQoACAkKAAhJikAIicqACMoKgAjKCwAIicqACQpLgAiJygAIicqACInKQAjKCoAIicqACInKgAiJyoAIicpACInKgAiJykAIigrACMoKwAiKCsAIyksACguMgAeIyYAHyQnACUqLgAiJyoAIicrACInKwAiJyoAICUoAB8kJwAgJCgAICQoACEmKQAiJyoAIygqACMoLAAiJyoAJCkuACInKAAiJyoAIicpACMoKgAiJyoAIicqACInKgAiJykAIicpACInKgAiJyoAJSouACMoLgAjKC0AIygrACInKQAiJyoAISYpACAlKAAgJSgAISYpACEmKQAfJCcAHyQnACAkKAAgJCgAISYpACInKgAjKCoAIygsACInKgAkKS4AIicoACInKgAiJykAIygqACInKgAiJyoAIicqACInKQAiJyoAIicpACIoKwAjKCsAIigrACMpLAAoLjIAHiMmAB8kJwAlKi4AIicqACInKwAiJysAIicqACAlKAAfJCcAIicqACMoLAAjKCwAIygsACQpLQAjKCsAIygrACInKwAjKCsAJCktACQpLgAkKS4AIygtACMoLAAjKS0AIygsACMoKwAiKCsAIicqACMnKwAiJyoAIicpACImKQAiJSgAISUoACInKQAiJykAIicpACImKQAiJykAIiYpACEmKQAiJyoAIygsACMoLAAjKCwAJCktACMoKwAjKCsAIicrACMoKwAkKS0AJCkuACQpLgAjKC0AIygsACMpLAAiKCwAJCktACUqLgAkKS0AJCktACMnLAAjKCoAJCktACMnKgAhJikAIicqACInKQAiJykAIiYpACInKQAiJikAISYpACInKgAjKCwAIygsACMoLAAkKS0AIygrACMoKwAiJysAIygrACQpLQAkKS4AJCkuACMoLQAjKCwAIyktACMoLAAjKCsAIigrACInKgAjJysAIicqACInKQAiJikAIiUoACElKAAiJykAIicpACInKQAiJikAIicpACImKQAhJikAIicqACMoLAAjKCwAIygsACQpLQAjKCsAIygrACInKwAjKCsAJCktACQpLgAkKS4AIygtACMoLAAjKSwAIigsACQpLQAlKi4AJCktACQpLQAjJywAIygqACQpLQAjJyoAISYpACInKgAiJykAIicpACImKQA='
    },
    fields: {
      name:       { x: 145, y: 57,  width: 215, height: 25, mode: 'gold',  kind: 'name' },
      stage:      { x: 78,  y: 82,  width: 104, height: 23, mode: 'white', kind: 'stage' },
      breed:      { x: 214, y: 88,  width: 275, height: 25, mode: 'white', kind: 'breed' },
      health:     { x: 84,  y: 181, width: 78,  height: 20, mode: 'white', kind: 'percent' },
      happiness:  { x: 84,  y: 199, width: 78,  height: 21, mode: 'white', kind: 'percent' },
      trait1:     { x: 216, y: 211, width: 94,  height: 31, mode: 'white', kind: 'trait' },
      trait2:     { x: 311, y: 211, width: 94,  height: 31, mode: 'white', kind: 'trait' },
      trait3:     { x: 406, y: 211, width: 94,  height: 31, mode: 'white', kind: 'trait' }
    }
  };

  const normalise = value => String(value || '')
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9?%]+/g, ' ')
    .trim();

  function editDistance(a, b) {
    const aa = normalise(a);
    const bb = normalise(b);
    const row = Array.from({ length: bb.length + 1 }, (_, i) => i);
    for (let i = 1; i <= aa.length; i += 1) {
      let previous = row[0];
      row[0] = i;
      for (let j = 1; j <= bb.length; j += 1) {
        const old = row[j];
        const cost = aa[i - 1] === bb[j - 1] ? 0 : 1;
        row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + cost);
        previous = old;
      }
    }
    return row[bb.length];
  }

  function bestMatch(line, values, maxDistance = 3) {
    const clean = normalise(line);
    if (!clean) return null;
    let best = null;
    for (const value of values) {
      const target = normalise(value);
      if (!target) continue;
      if (clean.includes(target) || target.includes(clean)) return value;
      const distance = editDistance(clean, target);
      const allowed = Math.min(maxDistance, Math.max(1, Math.floor(target.length * 0.2)));
      if (distance <= allowed && (!best || distance < best.distance)) best = { value, distance };
    }
    return best ? best.value : null;
  }

  function parseInspectionText(text) {
    const lines = String(text || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    const traitNames = root.POF_DATA.traits.map(trait => trait.name);
    const speciesNames = root.POF_DATA.species;
    const breedPairs = Object.values(root.POF_DATA.speciesData).flatMap(info => info.breeds.map(breed => ({ species: info.name, breed: breed.name })));
    const breedNames = breedPairs.map(item => item.breed);
    const result = {
      name: '', species: '', breed: '', gender: 'Unknown', stage: '', health: null,
      happiness: null, traits: [], diseased: false, confidence: 0, unmatched: []
    };

    for (const rawLine of lines) {
      const line = normalise(rawLine);
      const nameMatch = rawLine.match(/^name\s*:?\s*(.+)$/i);
      if (nameMatch) result.name = nameMatch[1].trim();

      if (/\b(male|bull|ram|rooster)\b/.test(line) || /\bgender\s*m\b/.test(line)) result.gender = 'Male';
      if (/\b(female|cow|ewe|hen)\b/.test(line) || /\bgender\s*f\b/.test(line)) result.gender = 'Female';

      const health = rawLine.match(/health\s*:?\s*(\d{1,3})\s*%?/i);
      const happiness = rawLine.match(/happiness\s*:?\s*(\d{1,3})\s*%?/i);
      if (health) result.health = Math.max(0, Math.min(100, Number(health[1])));
      if (happiness) result.happiness = Math.max(0, Math.min(100, Number(happiness[1])));
      if (/diseased|illness|sick animal/i.test(rawLine)) result.diseased = true;

      const stage = bestMatch(rawLine.replace(/^(age|stage)\s*:?/i, ''), root.POF_DATA.stages, 2);
      if (stage) result.stage = stage;

      const breed = bestMatch(rawLine.replace(/^breed\s*:?/i, '').replace(/\((?:male|female)\)/ig, ''), breedNames, 5);
      if (breed) {
        result.breed = breed;
        result.species = breedPairs.find(item => item.breed === breed)?.species || result.species;
      }

      const species = bestMatch(rawLine.replace(/^species\s*:?/i, ''), speciesNames, 3);
      if (species) result.species = species;

      const cleanedTraitLine = rawLine.replace(/^(trait\s*[123]?|slot\s*[123]?)\s*:?\s*/i, '');
      const trait = bestMatch(cleanedTraitLine, traitNames, 4);
      if (trait && !result.traits.includes(trait) && result.traits.length < 3) result.traits.push(trait);
      else if (!noTraitText(cleanedTraitLine) && !trait && !breed && !species && !stage && !/gender|species|breed|name|age|stage|health|happiness|disease|illness/i.test(rawLine)) result.unmatched.push(rawLine);
    }

    if (result.species && !result.breed) result.breed = root.POF_DATA.speciesData[result.species]?.breeds?.[0]?.name || '';
    let confidence = 0;
    if (result.species) confidence += 20;
    if (result.breed) confidence += 15;
    if (result.gender !== 'Unknown') confidence += 10;
    if (result.stage) confidence += 10;
    if (result.health !== null) confidence += 10;
    if (result.happiness !== null) confidence += 10;
    confidence += result.traits.length * 8;
    result.confidence = Math.min(100, confidence);
    return result;
  }

  function mixColor(r, g, b, a = 255) {
    return (b << 0) + (g << 8) + (r << 16) + (a << 24);
  }

  function extractOcrText(value) {
    let current = value;
    for (let depth = 0; depth < 3; depth += 1) {
      if (current === null || current === undefined) return '';
      if (typeof current === 'object') {
        if (typeof current.text === 'string') return current.text;
        if (Array.isArray(current.fragments)) return current.fragments.map(fragment => fragment && fragment.text || '').join('');
        return '';
      }
      const text = String(current).trim();
      if (!text) return '';
      if ((text.startsWith('{') && text.endsWith('}')) || (text.startsWith('[') && text.endsWith(']'))) {
        try { current = JSON.parse(text); continue; } catch (_) { return text; }
      }
      return text;
    }
    return '';
  }

  function cleanOcr(value) {
    return extractOcrText(value)
      .replace(/[\u0000-\u001f\u007f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function decodeRegion(encoded, width, height) {
    const binary = typeof atob === 'function'
      ? atob(encoded)
      : Buffer.from(encoded, 'base64').toString('binary');
    const data = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < width * height; i += 1) {
      const source = i * 4;
      data[source] = binary.charCodeAt(source + 2);
      data[source + 1] = binary.charCodeAt(source + 1);
      data[source + 2] = binary.charCodeAt(source);
      data[source + 3] = binary.charCodeAt(source + 3);
    }
    return { width, height, data };
  }

  function isTextPixel(r, g, b, mode) {
    if (mode === 'gold') return r > 125 && g > 90 && b < 180 && r > g && g > b;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    return r > 145 && g > 140 && b > 125 && max - min < 82;
  }

  function findTextBounds(image, mode = 'white') {
    let minX = image.width;
    let minY = image.height;
    let maxX = -1;
    let maxY = -1;
    let count = 0;
    for (let y = 0; y < image.height; y += 1) {
      for (let x = 0; x < image.width; x += 1) {
        const i = (x + y * image.width) * 4;
        if (!isTextPixel(image.data[i], image.data[i + 1], image.data[i + 2], mode)) continue;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
        count += 1;
      }
    }
    return count >= 6 ? { minX, minY, maxX, maxY, count } : null;
  }

  function readBoundRegion(api, handle, x, y, width, height) {
    const encoded = api.bindGetRegion(handle, Math.round(x), Math.round(y), Math.round(width), Math.round(height));
    if (!encoded) return null;
    return decodeRegion(encoded, width, height);
  }

  function noTraitText(value) {
    return /^(?:no\s*trait|none|empty|n\/?a)$/i.test(cleanOcr(value));
  }

  function canonicalCandidate(text, kind) {
    const value = cleanOcr(text);
    if (!value) return '';
    const traitNames = root.POF_DATA.traits.map(trait => trait.name);
    const breedNames = Object.values(root.POF_DATA.speciesData).flatMap(info => info.breeds.map(breed => breed.name));
    if (kind === 'stage') return bestMatch(value, root.POF_DATA.stages, 3) || value;
    if (kind === 'trait') return noTraitText(value) ? 'No Trait' : (bestMatch(value, traitNames, 5) || value);
    if (kind === 'percent') {
      const match = value.match(/\d{1,3}/);
      return match ? `${Math.max(0, Math.min(100, Number(match[0])))}%` : value;
    }
    if (kind === 'breed') {
      const gender = /female/i.test(value) ? 'female' : /male/i.test(value) ? 'male' : '';
      const breed = bestMatch(value.replace(/^breed\s*:?/i, '').replace(/\((?:male|female)\)/ig, ''), breedNames, 6);
      return breed ? `Breed: ${breed}${gender ? ` (${gender})` : ''}` : value;
    }
    return value;
  }

  function candidateScore(text, kind) {
    const value = cleanOcr(text);
    if (!value) return -Infinity;
    const traitNames = root.POF_DATA.traits.map(trait => trait.name);
    const breedNames = Object.values(root.POF_DATA.speciesData).flatMap(info => info.breeds.map(breed => breed.name));
    const fallback = Math.min(20, value.length);
    if (kind === 'stage') return bestMatch(value, root.POF_DATA.stages, 3) ? 220 : fallback;
    if (kind === 'breed') return bestMatch(value.replace(/^breed\s*:?/i, '').replace(/\((?:male|female)\)/ig, ''), breedNames, 6) ? 250 + (/\b(?:male|female)\b/i.test(value) ? 10 : 0) : fallback;
    if (kind === 'trait') return noTraitText(value) || bestMatch(value, traitNames, 5) ? 250 : fallback;
    if (kind === 'percent') return /\d{1,3}\s*%?/.test(value) ? 230 : fallback;
    if (kind === 'name') return /^[A-Za-z][A-Za-z '\-]{1,24}$/.test(value) ? 210 + Math.min(20, value.length) : fallback;
    return fallback;
  }

  function readTextField(api, handle, origin, field) {
    const image = readBoundRegion(api, handle, origin.x + field.x, origin.y + field.y, field.width, field.height);
    const bounds = image ? findTextBounds(image, field.mode) : null;
    if (!bounds) return { text: '', diagnostics: { reason: 'No text-colour pixels found.' } };

    const startX = origin.x + field.x + bounds.minX;
    const baselineY = origin.y + field.y + bounds.maxY;
    const fonts = field.kind === 'percent' ? ['chatmono', 'chat'] : ['chat', 'chatmono'];
    const colors = field.mode === 'gold'
      ? [mixColor(240, 190, 121), mixColor(255, 205, 130)]
      : [mixColor(255, 255, 255), mixColor(235, 235, 220), mixColor(210, 210, 200)];
    const candidates = new Map();

    const addCandidate = (attempt, x, y, font, source) => {
      const text = canonicalCandidate(attempt, field.kind);
      if (!text) return;
      const key = normalise(text);
      if (!key) return;
      const score = candidateScore(text, field.kind);
      const entry = candidates.get(key) || { text, score, count: 0, x, y, font, sources: new Set() };
      entry.count += 1;
      entry.score = Math.max(entry.score, score);
      entry.sources.add(source);
      candidates.set(key, entry);
    };

    for (const font of fonts) {
      for (const dx of [-1, 0, 1]) {
        for (const dy of [-2, -1, 0, 1, 2]) {
          const x = Math.round(startX + dx);
          const y = Math.round(baselineY + dy);
          if (typeof api.bindReadStringEx === 'function') {
            addCandidate(api.bindReadStringEx(handle, x, y, JSON.stringify({ fontname: font, allowgap: true, colors })), x, y, font, 'ex');
          }
          if (typeof api.bindReadString === 'function') addCandidate(api.bindReadString(handle, font, x, y), x, y, font, 'auto');
          if (typeof api.bindReadColorString === 'function') {
            for (const color of colors.slice(0, 2)) addCandidate(api.bindReadColorString(handle, font, color, x, y), x, y, font, 'color');
          }
        }
      }
    }

    const ranked = [...candidates.values()].sort((a, b) => {
      const rankA = a.score + Math.min(12, a.count) * 9 + a.sources.size * 4;
      const rankB = b.score + Math.min(12, b.count) * 9 + b.sources.size * 4;
      return rankB - rankA || b.count - a.count || b.score - a.score;
    });
    const best = ranked[0] || { text: '', score: -Infinity, count: 0, x: startX, y: baselineY, font: '', sources: new Set() };
    return {
      text: best.text,
      diagnostics: { x: best.x, y: best.y, font: best.font, bounds, votes: best.count, sources: [...best.sources], alternatives: ranked.slice(1, 4).map(item => ({ text: item.text, votes: item.count, score: item.score })) }
    };
  }

  function locateAnimalInfo(api = root.alt1) {
    if (!api) return { ok: false, error: 'Alt1 was not detected. Open this app inside Alt1.' };
    if (!api.permissionPixel) return { ok: false, error: 'Screen pixel permission is disabled for POF AIO.' };
    if (api.rsLinked === false || !Number(api.rsWidth) || !Number(api.rsHeight)) {
      return { ok: false, error: 'Alt1 is not linked to the RuneScape client.' };
    }
    if (typeof api.bindRegion !== 'function' || typeof api.bindFindSubImg !== 'function') {
      return { ok: false, error: 'This Alt1 build does not expose the required screen-reading functions.' };
    }

    const handle = api.bindRegion(0, 0, Number(api.rsWidth), Number(api.rsHeight));
    if (!(handle > 0)) return { ok: false, error: 'Alt1 could not capture the RuneScape window.' };
    const anchor = ANIMAL_INFO_LAYOUT.anchor;
    let matches = [];
    try {
      matches = JSON.parse(api.bindFindSubImg(handle, anchor.data, anchor.width, 0, 0, Number(api.rsWidth), Number(api.rsHeight)) || '[]');
    } catch (_) {
      return { ok: false, error: 'Alt1 returned an invalid result while locating Animal Info.' };
    }
    const valid = matches.map(match => ({
      x: Number(match.x) - anchor.xOffset,
      y: Number(match.y) - anchor.yOffset,
      anchorX: Number(match.x),
      anchorY: Number(match.y)
    })).filter(origin => (
      origin.x >= 0 && origin.y >= 0 &&
      origin.x < Number(api.rsWidth) - 120 &&
      origin.y < Number(api.rsHeight) - 120
    ));
    if (!valid.length) {
      return {
        ok: false,
        error: 'Animal Info was not found. Keep the complete window visible and use the the complete Animal Info window visible and unobstructed.',
        handle
      };
    }
    return { ok: true, handle, origin: valid[0], matches: valid.length };
  }

  function normaliseScannedField(value, kind) {
    const text = cleanOcr(value);
    if (kind === 'stage') return bestMatch(text, root.POF_DATA.stages, 3) || text;
    if (kind === 'trait') return noTraitText(text) ? 'No Trait' : (bestMatch(text, root.POF_DATA.traits.map(trait => trait.name), 5) || text);
    if (kind === 'percent') {
      const match = text.match(/\d{1,3}/);
      return match ? `${Math.max(0, Math.min(100, Number(match[0])))}%` : '';
    }
    return text;
  }

  function buildInspectionText(fields) {
    const lines = [];
    if (fields.name) lines.push(`Name: ${fields.name}`);
    if (fields.stage) lines.push(`Stage: ${fields.stage}`);
    if (fields.breed) lines.push(fields.breed.match(/^breed\s*:/i) ? fields.breed : `Breed: ${fields.breed}`);
    if (fields.health) lines.push(`Health: ${fields.health}`);
    if (fields.happiness) lines.push(`Happiness: ${fields.happiness}`);
    [fields.trait1, fields.trait2, fields.trait3].filter(Boolean).forEach((trait, index) => lines.push(`Trait ${index + 1}: ${trait}`));
    return lines.join('\n');
  }

  function scanAnimalInfo(api = root.alt1) {
    const located = locateAnimalInfo(api);
    if (!located.ok) return located;
    if (!root.POF_VISION || typeof root.POF_VISION.readPanel !== 'function') {
      return {
        ok: false,
        error: 'The dedicated POF text reader did not load. Fully close and reopen POF AIO, then try again.',
        origin: located.origin,
        matches: located.matches,
        layout: ANIMAL_INFO_LAYOUT.id
      };
    }

    let panelImage = null;
    try {
      const captureWidth = Math.max(1, Math.min(ANIMAL_INFO_LAYOUT.maxPanelWidth, Number(api.rsWidth) - located.origin.x));
      const captureHeight = Math.max(1, Math.min(ANIMAL_INFO_LAYOUT.maxPanelHeight, Number(api.rsHeight) - located.origin.y));
      panelImage = readBoundRegion(
        api,
        located.handle,
        located.origin.x,
        located.origin.y,
        captureWidth,
        captureHeight
      );
    } catch (error) {
      return {
        ok: false,
        error: `Animal Info was found, but Alt1 could not capture the panel: ${error && error.message ? error.message : 'unknown capture error'}`,
        origin: located.origin,
        matches: located.matches,
        layout: ANIMAL_INFO_LAYOUT.id
      };
    }
    if (!panelImage) {
      return {
        ok: false,
        error: 'Animal Info was found, but Alt1 returned no panel image.',
        origin: located.origin,
        matches: located.matches,
        layout: ANIMAL_INFO_LAYOUT.id
      };
    }

    let visionResult;
    try {
      visionResult = typeof root.POF_VISION.readPanelResponsive === 'function'
        ? root.POF_VISION.readPanelResponsive(panelImage)
        : root.POF_VISION.readPanel(panelImage);
    } catch (error) {
      return {
        ok: false,
        error: `The dedicated POF text reader failed: ${error && error.message ? error.message : 'unknown recognition error'}`,
        origin: located.origin,
        matches: located.matches,
        layout: ANIMAL_INFO_LAYOUT.id
      };
    }

    const fields = visionResult && visionResult.fields ? visionResult.fields : {};
    const diagnostics = {
      engine: 'pof-glyph-reader-v4',
      ...(visionResult && visionResult.diagnostics ? visionResult.diagnostics : {})
    };
    const rawText = buildInspectionText(fields);
    const parsed = parseInspectionText(rawText);
    const traitSlotsRead = [fields.trait1, fields.trait2, fields.trait3].every(Boolean);
    const enough = Boolean(fields.name && parsed.species && parsed.breed && parsed.gender !== 'Unknown' && parsed.stage && parsed.health !== null && parsed.happiness !== null && traitSlotsRead);
    return {
      ok: enough,
      partial: !enough && Boolean(rawText),
      error: enough ? '' : 'Animal Info was found, but one or more required fields could not be read. Keep the entire Animal Info window visible and unobstructed; the recognised text is available below for correction.',
      origin: located.origin,
      matches: located.matches,
      layout: ANIMAL_INFO_LAYOUT.id,
      fields,
      rawText,
      parsed,
      diagnostics
    };
  }

  function alt1Status() {
    return {
      detected: Boolean(root.alt1),
      permissionPixel: Boolean(root.alt1 && root.alt1.permissionPixel),
      rsLinked: Boolean(root.alt1 && root.alt1.rsLinked !== false && Number(root.alt1.rsWidth || 0)),
      rsWidth: root.alt1 ? Number(root.alt1.rsWidth || 0) : 0,
      rsHeight: root.alt1 ? Number(root.alt1.rsHeight || 0) : 0,
      version: root.alt1 ? String(root.alt1.version || '') : ''
    };
  }

  root.POF_SCANNER = {
    parseInspectionText,
    alt1Status,
    bestMatch,
    editDistance,
    locateAnimalInfo,
    scanAnimalInfo,
    buildInspectionText,
    findTextBounds,
    decodeRegion,
    extractOcrText,
    cleanOcr,
    canonicalCandidate,
    layout: ANIMAL_INFO_LAYOUT
  };
})();
