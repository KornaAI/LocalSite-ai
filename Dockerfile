FROM denoland/deno:2.8.3

# Install git (needed to clone the repository)
USER root
RUN apt-get update && apt-get install -y --no-install-recommends git \
    && rm -rf /var/lib/apt/lists/*

# Clone repository
RUN git clone https://github.com/weise25/LocalSite-ai.git /app

WORKDIR /app

# Cache/install dependencies and build the production bundle
RUN deno install
RUN deno task build

# Create script that generates the .env file at startup
RUN echo '#!/bin/sh' > /app/entrypoint.sh
RUN echo 'echo "# Configuration generated at startup" > .env' >> /app/entrypoint.sh
RUN echo 'echo "DEFAULT_PROVIDER=${DEFAULT_PROVIDER:-lm_studio}" >> .env' >> /app/entrypoint.sh
RUN echo 'echo "" >> .env' >> /app/entrypoint.sh
RUN echo 'echo "# Ollama Configuration (Local AI models)" >> .env' >> /app/entrypoint.sh
RUN echo 'echo "OLLAMA_API_BASE=http://host.docker.internal:11434" >> .env' >> /app/entrypoint.sh
RUN echo 'echo "" >> .env' >> /app/entrypoint.sh
RUN echo 'echo "# LM Studio Configuration (Local AI models)" >> .env' >> /app/entrypoint.sh
RUN echo 'echo "LM_STUDIO_API_BASE=http://host.docker.internal:1234/v1" >> .env' >> /app/entrypoint.sh
RUN echo 'exec "$@"' >> /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Expose port (adapter-node listens on 3000 by default)
EXPOSE 3000

# Use the entrypoint script
ENTRYPOINT ["/app/entrypoint.sh"]

# Start the production server
CMD ["deno", "run", "-A", "build/index.js"]
