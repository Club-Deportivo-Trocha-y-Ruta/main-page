<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="3.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml" lang="es">
      <head>
        <title><xsl:value-of select="/rss/channel/title"/> - RSS Feed</title>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: system-ui, -apple-system, sans-serif; color: #2f2f2f; max-width: 800px; margin: 0 auto; padding: 2rem 1rem; line-height: 1.6; }
          .header { background: linear-gradient(135deg, #20b7c9, #1a96a4); color: white; padding: 2rem; border-radius: 12px; margin-bottom: 2rem; }
          .header h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
          .header p { opacity: 0.9; font-size: 0.9rem; }
          .badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.8rem; margin-top: 0.75rem; }
          .item { border: 1px solid #e5e7eb; border-radius: 8px; padding: 1.25rem; margin-bottom: 1rem; transition: border-color 0.2s; }
          .item:hover { border-color: #20b7c9; }
          .item h2 { font-size: 1.1rem; margin-bottom: 0.5rem; }
          .item h2 a { color: #20b7c9; text-decoration: none; }
          .item h2 a:hover { text-decoration: underline; }
          .item .meta { font-size: 0.8rem; color: #5a5a5a; margin-bottom: 0.5rem; }
          .item .desc { font-size: 0.9rem; color: #5a5a5a; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1><xsl:value-of select="/rss/channel/title"/></h1>
          <p><xsl:value-of select="/rss/channel/description"/></p>
          <span class="badge">RSS Feed</span>
        </div>
        <xsl:for-each select="/rss/channel/item">
          <div class="item">
            <h2>
              <a>
                <xsl:attribute name="href"><xsl:value-of select="link"/></xsl:attribute>
                <xsl:value-of select="title"/>
              </a>
            </h2>
            <div class="meta"><xsl:value-of select="pubDate"/></div>
            <div class="desc"><xsl:value-of select="description"/></div>
          </div>
        </xsl:for-each>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
