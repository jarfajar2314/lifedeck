import { auth } from "@/lib/auth"

const handler = (request: Request) => auth.handler(request)

export const GET = handler
export const POST = handler
