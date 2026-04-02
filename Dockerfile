# ==========================================
# STAGE 1: Install Dependencies
# ==========================================
FROM oven/bun:alpine AS deps
WORKDIR /app

# Copy package.json and Bun's lockfile
# The asterisk handles both the old binary format (bun.lockb) and the new text format (bun.lock)
COPY package.json bun.lockb* bun.lock* ./

# Install dependencies strictly using the lockfile for reproducible builds
RUN bun install --frozen-lockfile

# ==========================================
# STAGE 2: Build the Application
# ==========================================
FROM oven/bun:alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV BUILD_PHASE=1
ENV NEXT_TELEMETRY_DISABLED=1

# Run the Next.js build process via Bun
RUN bun run build

# ==========================================
# STAGE 3: Production Runner
# ==========================================
FROM oven/bun:alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user for security
RUN addgroup --system --gid 1001 bunjs && \
    adduser --system --uid 1001 nextjs

# Set correct permissions for the Next.js cache directory
RUN mkdir .next && chown nextjs:bunjs .next

# Copy the standalone output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:bunjs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:bunjs /app/.next/static ./.next/static

# Switch to the non-root user
USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Run the standalone server natively with Bun instead of Node
CMD ["bun", "server.js"]