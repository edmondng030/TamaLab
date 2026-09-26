// HIGH CONFIDENCE from GMMan's tcp.md, Echo section. No hardware verification.
// https://github.com/GMMan/tama-para-research/blob/master/protocols/tcp.md
export function echoRequest() {
  return new TextEncoder().encode("ECHO REQ\r\n");
}
export const ECHO_REPLY = "ECHO REP";
