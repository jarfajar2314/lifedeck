import { getAuth } from "@/lib/auth"

const handler = async (request: Request) => (await getAuth()).handler(request)

export const GET = handler
export const POST = handler
