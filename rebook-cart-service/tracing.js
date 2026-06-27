// tracing.js
const opentelemetry = require("@opentelemetry/sdk-node");
const { getNodeAutoInstrumentations } = require("@opentelemetry/auto-instrumentations-node");
const { OTLPTraceExporter } = require("@opentelemetry/exporter-trace-otlp-proto");

// Configure the exporter to send traces to the Jaeger Docker OTLP port
const traceExporter = new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://localhost:4318/v1/traces",
});

const sdk = new opentelemetry.NodeSDK({
    serviceName: process.env.SERVICE_NAME || "anonymous-service",
    traceExporter: traceExporter,
    instrumentations: [
        getNodeAutoInstrumentations({
            // Capture specific deep database execution details automatically
            "@opentelemetry/instrumentation-mongoose": { enabled: true },
            "@opentelemetry/instrumentation-express": { enabled: true },
            "@opentelemetry/instrumentation-axios": { enabled: true }
        })
    ],
});

// Start the SDK runtime engine
sdk.start();
console.log(`👁️  OpenTelemetry auto-instrumentation active for: ${process.env.SERVICE_NAME}`);

// Gracefully shut down the tracing system when the Node process terminates
process.on("SIGTERM", () => {
    sdk.shutdown()
        .then(() => console.log("Tracing terminated safely"))
        .catch((error) => console.log("Error terminating tracing", error))
        .finally(() => process.exit(0));
});