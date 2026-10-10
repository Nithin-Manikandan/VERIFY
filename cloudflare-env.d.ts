declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    NVIDIA_API_KEY_1?: string;
    NVIDIA_API_KEY_2?: string;
    NVIDIA_MODEL?: string;
    NVIDIA_VISION_MODEL?: string;
    USPS_CLIENT_ID?: string;
    USPS_CLIENT_SECRET?: string;
  }
}
