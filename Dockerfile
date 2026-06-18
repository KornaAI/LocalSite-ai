FROM denoland/deno:2.8.3

WORKDIR /app

COPY . .

RUN deno install && deno task build

RUN echo '#!/bin/sh' > /app/entrypoint.sh && \
    echo 'echo "# Configuration generated at startup" > .env' >> /app/entrypoint.sh && \
    echo 'echo "DEFAULT_PROVIDER=${DEFAULT_PROVIDER:-ollama}" >> .env' >> /app/entrypoint.sh && \
    echo 'echo "" >> .env' >> /app/entrypoint.sh && \
    echo 'echo "# Ollama Configuration (Local AI models)" >> .env' >> /app/entrypoint.sh && \
    echo 'echo "OLLAMA_API_BASE=http://host.docker.internal:11434" >> .env' >> /app/entrypoint.sh && \
    echo 'echo "" >> .env' >> /app/entrypoint.sh && \
    echo 'echo "# LM Studio Configuration (Local AI models)" >> .env' >> /app/entrypoint.sh && \
    echo 'echo "LM_STUDIO_API_BASE=http://host.docker.internal:1234/v1" >> .env' >> /app/entrypoint.sh && \
    echo 'exec "$@"' >> /app/entrypoint.sh && \
    chmod +x /app/entrypoint.sh

RUN groupadd -r appuser && useradd -r -g appuser -u 1001 appuser && \
    chown -R appuser:appuser /app

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD deno eval "try { const r = await fetch('http://127.0.0.1:3000'); Deno.exit(r.ok ? 0 : 1); } catch { Deno.exit(1); }"

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["deno", "run", "-A", "build/index.js"]
