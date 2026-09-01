export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }

  static badRequest(code: string, message: string) {
    return new ApiError(400, code, message)
  }

  static unauthorized(message = '未登录或登录已过期') {
    return new ApiError(401, 'UNAUTHORIZED', message)
  }

  static forbidden(message = '无权访问') {
    return new ApiError(403, 'FORBIDDEN', message)
  }

  static notFound(message = '资源不存在') {
    return new ApiError(404, 'NOT_FOUND', message)
  }

  static conflict(code: string, message: string) {
    return new ApiError(409, code, message)
  }
}
