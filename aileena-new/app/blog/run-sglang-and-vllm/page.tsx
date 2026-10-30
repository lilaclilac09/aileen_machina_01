'use client';
import Link from 'next/link';
import SubstackShell from '../_substack/SubstackShell';

/**
 * How to quickly run SGLang and vLLM — quotes from official docs only.
 * Sibling to "Concepts You Think You Know": no invented thesis; Sources at the end.
 */

export default function RunSglangAndVllmArticle() {
  return (
    <SubstackShell
      category="Method"
      date="2026.10.30"
      tags="SGLang · vLLM · Serving · Scheduler · OpenAI API"
      title="How to Quickly Run SGLang and vLLM"
      dek="Official-docs quotes on entrypoints, I/O, and the scheduler/engine loop. Not a tutorial rewrite — Sources at the end."
    >
      <article style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 120px' }}>
        <p style={bodyStyle}>
          Core loop, I/O, entrypoints, scheduler — lines from the SGLang and vLLM docs only. Full
          pages in{' '}
          <a href="#sources" style={inlineLink}>
            Sources
          </a>
          .
        </p>

        <SectionLabel>1 · SGLang — start a server, one request</SectionLabel>
        <Quote cite="SGLang — Quickstart">
          Start a model server and verify it with one request.
        </Quote>
        <Quote cite="SGLang — Quickstart">
          sglang serve MODEL_PATH --host 0.0.0.0 --port 30000
        </Quote>
        <Quote cite="SGLang — Quickstart">
          Wait for The server is fired up and ready to roll!
        </Quote>
        <Quote cite="SGLang — Quickstart">
          curl http://localhost:30000/v1/chat/completions
        </Quote>

        <SectionLabel>2 · SGLang — offline engine vs HTTP</SectionLabel>
        <Quote cite="SGLang — Offline Engine API">
          SGLang provides a direct inference engine without the need for an HTTP server, especially
          for use cases where additional HTTP server adds unnecessary complexity or overhead.
        </Quote>
        <Quote cite="SGLang — Offline Engine API">
          Offline Batch Inference · Custom Server on Top of the Engine
        </Quote>
        <Quote cite="SGLang — Offline Engine API">
          SGLang offline engine supports batch inference with efficient scheduling.
        </Quote>
        <Quote cite="SGLang — Offline Engine API">
          llm = sgl.Engine(model_path=&quot;qwen/qwen2.5-0.5b-instruct&quot;)
        </Quote>

        <SectionLabel>3 · SGLang — native APIs + OpenAI-compatible I/O</SectionLabel>
        <Quote cite="SGLang — Native APIs">
          Apart from the OpenAI compatible APIs, the SGLang Runtime also provides its native server
          APIs.
        </Quote>
        <Quote cite="SGLang — Native APIs">
          /generate · /get_model_info · /server_info · /health · /flush_cache · /update_weights ·
          /encode · /v1/rerank · /v1/score · /v1/decisions · /classify · /detokenize
        </Quote>
        <Quote cite="SGLang — Native APIs">
          A full list of these APIs can be found at http_server.py
        </Quote>

        <SectionLabel>4 · SGLang — layer I/O boundary</SectionLabel>
        <Quote cite="SGLang — Layer boundaries">
          Declare stage inputs and outputs, bind communication and residual operations, and
          integrate model computation with layer boundaries.
        </Quote>
        <Quote cite="SGLang — Layer boundaries">
          The sglang.srt.layers.layer_boundary package manages the transition between compute
          stages. It completes outstanding reductions, moves token rows, applies the producer&apos;s
          residual update, and prepares the consumer&apos;s normalized or quantized input.
        </Quote>

        <SectionLabel>5 · vLLM — entrypoints</SectionLabel>
        <Quote cite="vLLM — Architecture Overview">
          vLLM provides a number of entrypoints for interacting with the system.
        </Quote>
        <Quote cite="vLLM — Architecture Overview">
          The LLM class provides the primary Python interface for doing offline inference, which is
          interacting with a model without using a separate model inference server.
        </Quote>
        <Quote cite="vLLM — Architecture Overview">
          The second primary interface to vLLM is via its online server. This server can be started
          using the vllm serve command.
        </Quote>
        <Quote cite="vLLM — Architecture Overview">vllm serve &lt;model&gt;</Quote>

        <SectionLabel>6 · vLLM — process loop (API · engine · workers)</SectionLabel>
        <Quote cite="vLLM — Architecture Overview (V1 Process Architecture)">
          The API server process handles HTTP requests (e.g., the OpenAI-compatible API), performs
          input processing (tokenization, multi-modal data loading), and streams results back to
          clients. It communicates with the engine core process(es) via ZMQ sockets.
        </Quote>
        <Quote cite="vLLM — Architecture Overview">
          The engine core process runs the scheduler, manages KV cache, and coordinates model
          execution across GPU workers. It runs a busy loop that continuously schedules requests and
          dispatches work to the GPU workers.
        </Quote>
        <Quote cite="vLLM — Architecture Overview">
          Each GPU is managed by a dedicated worker process. The worker process loads model weights,
          executes forward passes, and manages GPU memory.
        </Quote>

        <SectionLabel>7 · vLLM — scheduler</SectionLabel>
        <Quote cite="vLLM — Architecture Overview (Scheduler)">
          The scheduler runs inside the Engine Core Process and decides which requests execute each
          step.
        </Quote>
        <Quote cite="vLLM — Architecture Overview">
          The scheduler is token-budget-based: each step, it fills a budget of
          max_num_batched_tokens across both running and waiting requests. There are no separate
          prefill and decode phases. Each request tracks how many of its tokens have been computed,
          and the scheduler assigns it tokens to close the gap. This single loop handles chunked
          prefill, prefix caching and speculative decoding.
        </Quote>

        <SectionLabel>8 · vLLM — LLMEngine I/O</SectionLabel>
        <Quote cite="vLLM — Architecture Overview (LLMEngine)">
          The LLMEngine class is the core component of the vLLM engine. It is responsible for
          receiving requests from clients and generating outputs from the model. The LLMEngine
          includes input processing, model execution (possibly distributed across multiple hosts
          and/or GPUs), scheduling, and output processing.
        </Quote>
        <Quote cite="vLLM — Architecture Overview">
          Input Processing: Handles tokenization of input text using the specified tokenizer. ·
          Scheduling: Chooses which requests are processed in each step. · Model Execution: Manages
          the execution of the language model, including distributed execution across multiple GPUs.
          · Output Processing: Processes the outputs generated by the model, decoding the token IDs
          from a language model into human-readable text.
        </Quote>
        <Quote cite="vLLM — Architecture Overview (AsyncLLMEngine)">
          The AsyncLLMEngine class is an asynchronous wrapper for the LLMEngine class. It uses
          asyncio to create a background loop that continuously processes incoming requests. The
          AsyncLLMEngine is designed for online serving, where it can handle multiple concurrent
          requests and stream outputs to clients.
        </Quote>
        <Quote cite="vLLM — Architecture Overview">
          The OpenAI-compatible API server uses the AsyncLLMEngine.
        </Quote>

        <SectionLabel>9 · vLLM — OpenAI-compatible I/O</SectionLabel>
        <Quote cite="vLLM — OpenAI-Compatible Server">
          vLLM provides an HTTP server that implements OpenAI&apos;s Completions API, Chat API, and
          more! This functionality lets you serve models and interact with them using an HTTP
          client.
        </Quote>
        <Quote cite="vLLM — OpenAI-Compatible Server">
          vllm serve NousResearch/Meta-Llama-3-8B-Instruct --dtype auto --api-key token-abc123
        </Quote>
        <Quote cite="vLLM — OpenAI-Compatible Server">
          base_url=&quot;http://localhost:8000/v1&quot;
        </Quote>

        <SectionLabel id="sources">Sources</SectionLabel>
        <ol style={sourceList}>
          <li>
            SGLang —{' '}
            <a
              href="https://docs.sglang.io/docs/get-started/quickstart.md"
              target="_blank"
              rel="noopener noreferrer"
              style={inlineLink}
            >
              Quickstart
            </a>
          </li>
          <li>
            SGLang —{' '}
            <a
              href="https://docs.sglang.io/docs/basic_usage/offline_engine_api.md"
              target="_blank"
              rel="noopener noreferrer"
              style={inlineLink}
            >
              Offline Engine API
            </a>
          </li>
          <li>
            SGLang —{' '}
            <a
              href="https://docs.sglang.io/docs/basic_usage/native_api.md"
              target="_blank"
              rel="noopener noreferrer"
              style={inlineLink}
            >
              SGLang Native APIs
            </a>
          </li>
          <li>
            SGLang —{' '}
            <a
              href="https://docs.sglang.io/docs/developer_guide/layer_boundary.md"
              target="_blank"
              rel="noopener noreferrer"
              style={inlineLink}
            >
              Layer boundaries
            </a>
          </li>
          <li>
            vLLM —{' '}
            <a
              href="https://docs.vllm.ai/en/latest/design/arch_overview/"
              target="_blank"
              rel="noopener noreferrer"
              style={inlineLink}
            >
              Architecture Overview
            </a>{' '}
            (also{' '}
            <a
              href="https://github.com/vllm-project/vllm/blob/main/docs/design/arch_overview.md"
              target="_blank"
              rel="noopener noreferrer"
              style={inlineLink}
            >
              GitHub source
            </a>
            )
          </li>
          <li>
            vLLM —{' '}
            <a
              href="https://docs.vllm.ai/en/latest/serving/openai_compatible_server/"
              target="_blank"
              rel="noopener noreferrer"
              style={inlineLink}
            >
              OpenAI-Compatible Server
            </a>
          </li>
          <li>
            vLLM —{' '}
            <a
              href="https://docs.vllm.ai/en/latest/getting_started/quickstart/"
              target="_blank"
              rel="noopener noreferrer"
              style={inlineLink}
            >
              Quickstart
            </a>
          </li>
        </ol>

        <p style={{ ...bodyStyle, marginTop: 48 }}>
          Sibling reset:{' '}
          <Link href="/blog/semi-basics-review" style={inlineLink}>
            Concepts You Think You Know
          </Link>
          .
        </p>
      </article>
    </SubstackShell>
  );
}

function SectionLabel({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <p
      id={id}
      style={{
        fontSize: '0.7rem',
        letterSpacing: '0.18em',
        color: '#00ffea',
        textTransform: 'uppercase',
        marginBottom: 20,
        marginTop: 56,
        opacity: 0.8,
      }}
    >
      {children}
    </p>
  );
}

function Quote({ children, cite }: { children: React.ReactNode; cite: string }) {
  return (
    <figure style={{ margin: '0 0 28px' }}>
      <blockquote style={quoteStyle}>{children}</blockquote>
      <figcaption style={citeStyle}>— {cite}</figcaption>
    </figure>
  );
}

const bodyStyle: React.CSSProperties = {
  fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
  lineHeight: 1.9,
  color: 'rgba(255,255,255,0.65)',
  letterSpacing: '0.025em',
  marginBottom: 24,
};
const inlineLink: React.CSSProperties = {
  color: '#00ffea',
  textDecoration: 'underline',
  textUnderlineOffset: 3,
};
const quoteStyle: React.CSSProperties = {
  margin: 0,
  padding: '20px 24px',
  borderLeft: '3px solid #00ffea',
  background: 'linear-gradient(90deg, rgba(0,255,234,0.08), rgba(0,255,234,0.0))',
  fontSize: 'clamp(1.0rem, 2.2vw, 1.18rem)',
  lineHeight: 1.55,
  color: 'rgba(255,255,255,0.9)',
  fontStyle: 'italic',
};
const citeStyle: React.CSSProperties = {
  marginTop: 10,
  fontSize: '0.78rem',
  letterSpacing: '0.04em',
  color: 'rgba(255,255,255,0.45)',
  paddingLeft: 24,
};
const sourceList: React.CSSProperties = {
  fontSize: 'clamp(0.95rem, 2vw, 1.05rem)',
  lineHeight: 1.85,
  color: 'rgba(255,255,255,0.7)',
  paddingLeft: 22,
  marginBottom: 24,
};
