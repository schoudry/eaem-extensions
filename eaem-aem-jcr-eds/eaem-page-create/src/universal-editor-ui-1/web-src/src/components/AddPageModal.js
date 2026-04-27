/*
 * <license header>
 */

import React, { useState, useEffect } from 'react'
import { attach } from "@adobe/uix-guest"
import {
  Flex,
  Form,
  Provider,
  Content,
  defaultTheme,
  Text,
  TextField,
  ButtonGroup,
  Button,
  Heading,
  View,
  Divider,
  Grid,
  repeat,
  minmax,
} from '@adobe/react-spectrum'

import { extensionId, editorCanvasHashPathPrefix } from "./Constants"

function slugifyPageTitle(title) {
  return title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function canvasHashHrefForSlug(slug) {
  const base = editorCanvasHashPathPrefix.trim().replace(/\/+$/, '')
  const s = String(slug).trim().replace(/^\/+/, '')
  return `${base}/${s}`
}

function isHostEditorNavigateHref(href) {
  const h = String(href).trim()
  if (!h || !h.startsWith('/') || h.startsWith('//')) return false
  if (/^https?:\/\//i.test(h)) return false
  if (/^\/@/.test(h)) return false
  return true
}

function fullExperienceUrlForSlug(slug) {
  return `https://experience.adobe.com/#${canvasHashHrefForSlug(slug)}`
}

function navigateExperienceShell(url) {
  try {
    const topWin = window.top
    if (topWin && topWin !== window) {
      topWin.location.assign(url)
      return true
    }
  } catch {
    /* sandboxed iframe without allow-top-navigation can throw */
  }
  try {
    window.location.assign(url)
    return true
  } catch {
    return false
  }
}

function normalizeAemParentPath(input) {
  const t = String(input).trim().replace(/\/+$/, '')
  if (!t) return ''
  return t.startsWith('/') ? t : `/${t}`
}

function dirnamePathSegments(trimmedPath) {
  const t = trimmedPath.replace(/\/+$/, '')
  if (!t.startsWith('/') || t.length <= 1) return ''
  const lastSlash = t.lastIndexOf('/')
  if (lastSlash <= 0) return ''
  return t.slice(0, lastSlash)
}

function parentDirFromEditorLocation(location) {
  if (!location || typeof location !== 'string') return ''
  let path = location.trim()
  try {
    if (/^https?:\/\//i.test(path)) {
      path = new URL(path).pathname
    }
  } catch {
    return ''
  }
  path = path.split('?')[0].split('#')[0]
  if (!path) return ''
  try {
    path = decodeURIComponent(path)
  } catch {
    /* keep path */
  }
  const trimmed = path.replace(/\/+$/, '')
  if (!trimmed.startsWith('/')) return ''

  const idx = trimmed.indexOf('/content/')
  const contentPath = idx >= 0 ? trimmed.slice(idx) : (trimmed.startsWith('/content/') ? trimmed : '')
  if (contentPath) {
    const t = contentPath.replace(/\/+$/, '')
    const lastSlash = t.lastIndexOf('/')
    if (lastSlash >= '/content/'.length - 1 && lastSlash > 0) {
      return t.slice(0, lastSlash)
    }
  }

  return dirnamePathSegments(trimmed)
}

function getAemHost(editorState) {
  const conn = editorState?.connections?.aemconnection
  if (!conn || typeof conn !== 'string') return ''
  const idx = conn.indexOf('xwalk:')
  if (idx < 0) return ''
  let host = conn.substring(idx + 6)
  if (host.includes('?ref=')) {
    host = host.split('?ref=')[0]
  }
  return host
}

async function fetchConfTemplates(aemHost, aemToken) {
  try {
    const base = String(aemHost || '').replace(/\/+$/, '')
    if (!base) return []

    const url = new URL(`${base}/bin/querybuilder.json`)
    url.searchParams.set('path', '/conf')
    url.searchParams.set('type', 'cq:Template')

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${aemToken}`,
      },
    })

    if (!response.ok) {
      console.warn(
        'QueryBuilder conf templates:',
        response.status,
        response.statusText
      )
      return []
    }

    const data = await response.json()
    return Array.isArray(data.hits) ? data.hits : []
  } catch (e) {
    console.error('fetchConfTemplates failed', e)
    return []
  }
}

/** Display title from a cq:Template QB hit */
function qbHitTitle(hit) {
  return hit?.title || 'Template'
}

function qbHitPathLabel(hit) {
  return hit?.path ?? hit?.['jcr:path'] ?? ''
}

export default function AddPageModal () {
  const [guestConnection, setGuestConnection] = useState()
  const [pageTitle, setPageTitle] = useState('')
  const [parentPath, setParentPath] = useState('')
  const [confTemplates, setConfTemplates] = useState([])
  /** Index into `confTemplates`; avoids duplicate QB paths breaking React keys / selection. */
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(null)

  useEffect(() => {
    (async () => {
      const guestConnection = await attach({ id: extensionId })

      setGuestConnection(guestConnection)

      try {
        const state = await guestConnection.host?.editorState?.get?.()
        const token = await guestConnection.sharedContext?.get?.('token')
        const aemHost = state ? getAemHost(state) : ''
        
        if (aemHost && token) {
          const hits = await fetchConfTemplates(aemHost, token)

          setConfTemplates(hits)
        }
      } catch (e) {
        console.warn('AddPageModal: could not load cq:Template list under /conf', e)
      }
    })()
  }, [])

  const onCloseHandler = () => {
    guestConnection?.host?.modal?.close?.()
  }

  const onCreatePage = async () => {
    const slug = slugifyPageTitle(pageTitle)
    if (!slug) return

    const fullUrl = fullExperienceUrlForSlug(slug)
    const navigateTo = guestConnection?.host?.editorActions?.navigateTo

    let editorLocation = ''
    try {
      const editorState = await guestConnection?.host?.editorState?.get?.()
      editorLocation = editorState?.location ?? ''
    } catch {
      editorLocation = ''
    }

    const normalizedParentInput = normalizeAemParentPath(parentPath)
    const parentBase =
      normalizedParentInput ||
      parentDirFromEditorLocation(editorLocation) ||
      ''

    const newContentPath = parentBase
      ? `${parentBase}/${slug}`.replace(/\/+/g, '/')
      : ''

    const hostNavigateHrefs = [newContentPath]
      .filter(Boolean)
      .filter(isHostEditorNavigateHref)

    const tryHostNavigateTo = async (href) => {
      if (typeof navigateTo !== 'function') {
        throw new Error('editorActions.navigateTo is not available')
      }
      await navigateTo(String(href).trim())
    }

    let navigated = false
    let lastErr
    if (typeof navigateTo === 'function') {
      for (const href of hostNavigateHrefs) {
        try {
          await tryHostNavigateTo(href)
          navigated = true
          break
        } catch (e) {
          lastErr = e
        }
      }
    } else {
      lastErr = new Error('editorActions.navigateTo is not available (modal GuestUI context)')
    }

    if (!navigated && navigateExperienceShell(fullUrl)) {
      navigated = true
    }

    if (!navigated) {
      guestConnection?.host?.editorActions?.toast?.(
        'negative',
        'Could not switch the editor to the new page. Try opening the link manually.',
        6000
      )
      console.warn('navigation failed for all strategies', lastErr, {
        hostNavigateHrefs,
        shellUrl: fullUrl
      })
      try {
        window.open(fullUrl, '_blank', 'noopener,noreferrer')
      } catch (e3) {
        console.warn('window.open fallback failed', e3)
      }
    }

    guestConnection?.host?.modal?.close?.().catch(() => {})
  }

  const slug = slugifyPageTitle(pageTitle)
  const canCreate = Boolean(slug)

  return (
    <Provider theme={defaultTheme} colorScheme="light">
      <Content
        width="100%"
        UNSAFE_style={{
          maxWidth: '100%',
          overflowX: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        <View
          padding="size-200"
          UNSAFE_style={{
            backgroundColor: 'white',
            maxWidth: '100%',
            minWidth: 0,
            overflowX: 'hidden',
            boxSizing: 'border-box',
          }}
        >
          <header>
            <Heading level={2}>Create AEM page (v5)</Heading>
          </header>

          <Divider size="S" marginTop="size-300" marginBottom="size-300" />

          <section aria-labelledby="add-page-steps-heading">
            <Heading id="add-page-steps-heading" level={4}>
              Before you create the page
            </Heading>
            <Flex direction="column" gap="size-100" marginTop="size-150">
              <Text>
                <strong>Context</strong> — Confirm the correct site and language
                copy are open in the editor so the new page is created in the
                right hierarchy.
              </Text>
              <Text>
                <strong>Naming</strong> — Use a clear title; as you would like
                it to appear in a Menu.
              </Text>
            </Flex>
          </section>

          <Divider size="S" marginTop="size-300" marginBottom="size-300" />

          <section aria-labelledby="add-page-form-heading">
            <Heading id="add-page-form-heading" level={4}></Heading>
            <Form
              marginTop="size-200"
              maxWidth="100%"
              onSubmit={(e) => e.preventDefault()}
              UNSAFE_style={{ maxWidth: '100%', minWidth: 0, overflowX: 'hidden' }}
            >
              <TextField
                label="Page title"
                name="pageTitle"
                value={pageTitle}
                onChange={setPageTitle}
                description="Shown in navigation and page metadata."
                width="100%"
              />
              <TextField
                label="Parent path (optional)"
                name="parentPath"
                value={parentPath}
                onChange={setParentPath}
                description="Optional repository parent (e.g. /content/mysite/us/en). Blank uses the current page path when the editor reports it; otherwise Create page still opens the canvas URL from the title."
                width="100%"
                marginTop="size-200"
              />
            </Form>

            <Heading id="template-cards-heading" level={4} marginTop="size-300">
              Templates
            </Heading>
            {confTemplates.length === 0 ? (
              <Text marginTop="size-150">
                No templates loaded yet, or none returned from Query Builder.
              </Text>
            ) : (
              <Grid
                aria-labelledby="template-cards-heading"
                columns={repeat('auto-fill', minmax('148px', '1fr'))}
                gap="size-150"
                marginTop="size-200"
                width="100%"
                UNSAFE_style={{
                  maxHeight: 260,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                }}
              >
                {confTemplates.map((hit, index) => {
                  const selected = selectedTemplateIndex === index
                  const toggle = () =>
                    setSelectedTemplateIndex((i) =>
                      i === index ? null : index
                    )

                  return (
                    <View
                      key={`template-card-${index}`}
                      padding="size-150"
                      role="button"
                      tabIndex={0}
                      aria-pressed={selected}
                      aria-label={`Template ${qbHitTitle(hit)}`}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        toggle()
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          toggle()
                        }
                      }}
                      UNSAFE_style={{
                        cursor: 'pointer',
                        boxSizing: 'border-box',
                        minWidth: 0,
                        borderRadius: 8,
                        userSelect: 'none',
                        outline: selected ? '2px solid #1473e6' : 'none',
                        outlineOffset: selected ? 2 : 0,
                        backgroundColor: selected ? '#dbeafe' : '#f5f5f5',
                        border: selected
                          ? '2px solid #1473e6'
                          : '1px solid #d0d0d0',
                        boxShadow: selected
                          ? 'inset 0 0 0 1px rgba(20, 115, 230, 0.35)'
                          : 'none',
                      }}
                    >
                      <Heading level={5}>{qbHitTitle(hit)}</Heading>
                      <Text
                        marginTop="size-75"
                        UNSAFE_style={{
                          fontSize: 11,
                          opacity: 0.85,
                          wordBreak: 'break-word',
                        }}
                      >
                        {qbHitPathLabel(hit)}
                      </Text>
                    </View>
                  )
                })}
              </Grid>
            )}
          </section>

          <View
            marginTop="size-300"
            UNSAFE_style={{ backgroundColor: "white" }}
          >
            <Flex
              width="100%"
              maxWidth="100%"
              minWidth={0}
              justifyContent="end"
              alignItems="center"
              marginTop="size-400"
              paddingEnd="size-400"
            >
              <ButtonGroup align="end">
                <Button
                  variant="accent"
                  isDisabled={!canCreate}
                  onPress={onCreatePage}
                >
                  Create page
                </Button>
                <Button variant="secondary" onPress={onCloseHandler}>
                  Close
                </Button>
              </ButtonGroup>
            </Flex>
          </View>
        </View>
      </Content>
    </Provider>
  );
}
