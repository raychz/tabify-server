import { Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import * as Sentry from '@sentry/node';

@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (status >= 400) {
      const transactionId = request.headers['x-transaction-id'];
      const uid = request.user && request.user.uid;
      const sentryRequestData = Sentry.Handlers.parseRequest({}, request);
      const sentrySeverity = status < 500 ? Sentry.Severity.Warning : Sentry.Severity.Error;

      Sentry.configureScope(scope => {
        scope.setLevel(sentrySeverity);
        scope.setExtra('req', sentryRequestData);
        scope.setTransaction(transactionId);
        scope.setUser({
          id: uid,
        });
      });
      Sentry.captureException(exception);
    }

    super.catch(exception, host);
  }
}
