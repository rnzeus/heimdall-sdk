#import <Foundation/Foundation.h>
#import <Security/Security.h>
#import "GCDAsyncSocket.h"

@interface Client : NSObject <GCDAsyncSocketDelegate>
@property(nonatomic, strong) GCDAsyncSocket *socket;
@property(nonatomic, copy) NSString *pem;
@end

@implementation Client
- (void)socket:(GCDAsyncSocket *)sock didConnectToHost:(NSString *)host port:(uint16_t)port {
  NSLog(@"tcp connected, startTLS");
  [sock startTLS:@{GCDAsyncSocketManuallyEvaluateTrust : @YES}];
  [sock readDataWithTimeout:-1 tag:0];
}

- (void)socket:(GCDAsyncSocket *)sock didReceiveTrust:(SecTrustRef)trust completionHandler:(void (^)(BOOL))completionHandler {
  SecCertificateRef server = SecTrustGetCertificateAtIndex(trust, 0);
  NSData *serverData = (__bridge_transfer NSData *)SecCertificateCopyData(server);
  NSString *b64 = [[[self.pem stringByReplacingOccurrencesOfString:@"-----BEGIN CERTIFICATE-----" withString:@""]
      stringByReplacingOccurrencesOfString:@"-----END CERTIFICATE-----" withString:@""]
      stringByReplacingOccurrencesOfString:@"\n" withString:@""];
  NSData *local = [[NSData alloc] initWithBase64EncodedString:b64 options:NSDataBase64DecodingIgnoreUnknownCharacters];
  BOOL ok = [serverData isEqualToData:local];
  NSLog(@"didReceiveTrust: server %lu bytes, pinned %lu bytes, equal=%d", (unsigned long)serverData.length, (unsigned long)local.length, ok);
  completionHandler(ok);
}

- (void)socketDidSecure:(GCDAsyncSocket *)sock {
  NSLog(@"secured");
  NSString *hello = @"{\"kind\":\"hello\",\"v\":1,\"channel\":\"heimdall://local-spike\",\"clientId\":\"gcd\",\"sessionId\":\"gcd\",\"auth\":{\"token\":\"nope\"}}\r\n";
  [sock writeData:[hello dataUsingEncoding:NSUTF8StringEncoding] withTimeout:-1 tag:1];
}

- (void)socket:(GCDAsyncSocket *)sock didReadData:(NSData *)data withTag:(long)tag {
  NSLog(@"read: %@", [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding]);
  [sock readDataWithTimeout:-1 tag:0];
}

- (void)socketDidDisconnect:(GCDAsyncSocket *)sock withError:(NSError *)err {
  NSLog(@"disconnected: %@", err);
  exit(0);
}
@end

int main(int argc, const char *argv[]) {
  @autoreleasepool {
    Client *client = [Client new];
    client.pem = [NSString stringWithContentsOfFile:@(argv[3]) encoding:NSUTF8StringEncoding error:nil];
    client.socket = [[GCDAsyncSocket alloc] initWithDelegate:client delegateQueue:dispatch_get_main_queue()];
    NSError *error = nil;
    [client.socket connectToHost:@(argv[1]) onPort:(uint16_t)atoi(argv[2]) error:&error];
    if (error) NSLog(@"connect error %@", error);
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, 10 * NSEC_PER_SEC), dispatch_get_main_queue(), ^{
      NSLog(@"timeout");
      exit(1);
    });
    dispatch_main();
  }
}
