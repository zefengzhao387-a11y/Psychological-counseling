import { useEffect, useRef, useState, createElement, useMemo, useCallback } from 'react'
import './TextType.css'

export default function TextType({
  text,
  texts,
  as: Component = 'span',
  typingSpeed = 50,
  initialDelay = 0,
  pauseDuration = 2000,
  deletingSpeed = 30,
  loop = true,
  className = '',
  showCursor = true,
  hideCursorWhileTyping = false,
  cursorCharacter = '|',
  cursorClassName = '',
  cursorBlinkDuration = 0.5,
  textColors = [],
  variableSpeed,
  variableSpeedEnabled = false,
  variableSpeedMin = 60,
  variableSpeedMax = 120,
  onSentenceComplete,
  startOnVisible = false,
  reverseMode = false,
  ...props
}) {
  const [displayedText, setDisplayedText] = useState('')
  const [currentCharIndex, setCurrentCharIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [currentTextIndex, setCurrentTextIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(!startOnVisible)
  const containerRef = useRef(null)

  const resolvedVariableSpeed = variableSpeedEnabled
    ? variableSpeed ?? { min: variableSpeedMin, max: variableSpeedMax }
    : variableSpeed

  const textArray = useMemo(() => {
    const source = texts ?? text
    if (Array.isArray(source)) return source.filter(Boolean)
    return source ? [source] : []
  }, [text, texts])

  const getRandomSpeed = useCallback(() => {
    if (!resolvedVariableSpeed) return typingSpeed
    const { min, max } = resolvedVariableSpeed
    return Math.random() * (max - min) + min
  }, [resolvedVariableSpeed, typingSpeed])

  const getCurrentTextColor = () => {
    if (textColors.length === 0) return undefined
    return textColors[currentTextIndex % textColors.length]
  }

  useEffect(() => {
    if (!startOnVisible || !containerRef.current) return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setIsVisible(true)
        })
      },
      { threshold: 0.1 },
    )

    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [startOnVisible])

  useEffect(() => {
    if (!isVisible || textArray.length === 0) return undefined

    let timeout
    const currentText = textArray[currentTextIndex] ?? ''
    const processedText = reverseMode ? currentText.split('').reverse().join('') : currentText

    const executeTypingAnimation = () => {
      if (isDeleting) {
        if (displayedText === '') {
          setIsDeleting(false)
          if (currentTextIndex === textArray.length - 1 && !loop) return

          onSentenceComplete?.(textArray[currentTextIndex], currentTextIndex)

          setCurrentTextIndex((prev) => (prev + 1) % textArray.length)
          setCurrentCharIndex(0)
          timeout = setTimeout(() => {}, pauseDuration)
        } else {
          timeout = setTimeout(() => {
            setDisplayedText((prev) => prev.slice(0, -1))
          }, deletingSpeed)
        }
      } else if (currentCharIndex < processedText.length) {
        timeout = setTimeout(
          () => {
            setDisplayedText((prev) => prev + processedText[currentCharIndex])
            setCurrentCharIndex((prev) => prev + 1)
          },
          resolvedVariableSpeed ? getRandomSpeed() : typingSpeed,
        )
      } else if (textArray.length >= 1) {
        if (!loop && currentTextIndex === textArray.length - 1) return
        timeout = setTimeout(() => {
          setIsDeleting(true)
        }, pauseDuration)
      }
    }

    if (currentCharIndex === 0 && !isDeleting && displayedText === '') {
      timeout = setTimeout(executeTypingAnimation, initialDelay)
    } else {
      executeTypingAnimation()
    }

    return () => clearTimeout(timeout)
  }, [
    currentCharIndex,
    displayedText,
    isDeleting,
    typingSpeed,
    deletingSpeed,
    pauseDuration,
    textArray,
    currentTextIndex,
    loop,
    initialDelay,
    isVisible,
    reverseMode,
    resolvedVariableSpeed,
    getRandomSpeed,
    onSentenceComplete,
  ])

  const currentLength = textArray[currentTextIndex]?.length ?? 0
  const shouldHideCursor =
    hideCursorWhileTyping && (currentCharIndex < currentLength || isDeleting)

  const cursorStyle =
    cursorBlinkDuration !== 0.5
      ? { animationDuration: `${cursorBlinkDuration}s` }
      : undefined

  return createElement(
    Component,
    {
      ref: containerRef,
      className: `text-type ${className}`.trim(),
      ...props,
    },
    createElement(
      'span',
      { style: { color: getCurrentTextColor() } },
      displayedText,
    ),
    showCursor &&
      createElement(
        'span',
        {
          className: `text-type__cursor ${cursorClassName}${
            shouldHideCursor ? ' text-type__cursor--hidden' : ''
          }`.trim(),
          style: cursorStyle,
          'aria-hidden': true,
        },
        cursorCharacter,
      ),
  )
}
