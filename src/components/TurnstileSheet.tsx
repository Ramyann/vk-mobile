import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import { WEBSITE_URL } from "../config/environment";
import { colors, radius } from "../styles/tokens";

const TURNSTILE_SITE_KEY = process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY;

/**
 * Cloudflare validates a hostname, so a raw HTML WebView has an opaque origin
 * and is rejected. This keeps the WebView on the already-approved Visit
 * Kurdistan origin, replaces its document before paint, and posts the token to
 * native code. Visitors remain in this in-app modal throughout.
 */
const verificationScript = TURNSTILE_SITE_KEY
  ? `
  (function () {
    document.documentElement.innerHTML = '<head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#FFFDEB;color:#141414;font-family:-apple-system,BlinkMacSystemFont,sans-serif}main{padding:28px 20px}p{font-size:15px;line-height:1.5;margin:0 0 22px}</style></head><body><main><p>Complete this quick check to continue.</p><div id="turnstile"></div></main></body>';
    function send(type, value) { window.ReactNativeWebView.postMessage(JSON.stringify(Object.assign({ type: type }, value || {}))); }
    function mount() {
      if (!window.turnstile) { setTimeout(mount, 50); return; }
      window.turnstile.render('#turnstile', {
        sitekey: '${TURNSTILE_SITE_KEY}', theme: 'light',
        callback: function (token) { send('turnstile-token', { token: token }); },
        'error-callback': function () { send('turnstile-error'); return true; },
        'expired-callback': function () { send('turnstile-error'); }
      });
    }
    var script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true; script.defer = true; script.onload = mount;
    script.onerror = function () { send('turnstile-error'); };
    document.head.appendChild(script);
  })(); true;
`
  : "true;";

export function TurnstileSheet({
  visible,
  onClose,
  onToken,
}: {
  visible: boolean;
  onClose: () => void;
  onToken: (token: string) => void;
}) {
  const onMessage = (event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data) as {
        type?: string;
        token?: string;
      };
      if (message.type === "turnstile-token" && message.token)
        onToken(message.token);
    } catch {
      // Keep the challenge visible; Cloudflare can be retried without losing form input.
    }
  };
  return (
    <Modal animationType="slide" onRequestClose={onClose} visible={visible}>
      <View style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Quick security check</Text>
          <Pressable onPress={onClose} accessibilityRole="button">
            <Text style={styles.close}>Close</Text>
          </Pressable>
        </View>
        {TURNSTILE_SITE_KEY ? (
          <WebView
            injectedJavaScript={verificationScript}
            onMessage={onMessage}
            source={{ uri: WEBSITE_URL }}
            style={styles.webView}
          />
        ) : (
          <Text style={styles.error}>
            Chat verification has not been configured for this app.
          </Text>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: colors.white, flex: 1, paddingTop: 54 },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  title: { color: colors.dark, fontSize: 22, fontWeight: "900" },
  close: { color: colors.primary, fontSize: 15, fontWeight: "800" },
  webView: { flex: 1, marginTop: 14 },
  error: { color: colors.danger, fontSize: 14, lineHeight: 20, padding: 20 },
});
