package tz.afrn.footballmanagement;

import android.app.Activity;
import android.content.ContentValues;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.widget.Toast;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import android.webkit.CookieManager;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.view.View;

public class MainActivity extends Activity {
    private WebView webView;
    private ValueCallback<Uri[]> filePathCallback;
    private static final int FILE_CHOOSER_REQUEST = 1001;
    private static final String APP_URL = "https://enyonyiabemba94-eng.github.io/AFRN-FOOTBALL-MANAGEMENT/";

    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        webView = new WebView(this);
        setContentView(webView);

        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(true);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setCacheMode(WebSettings.LOAD_NO_CACHE);
        s.setUserAgentString(s.getUserAgentString() + " AFRN-Android/1.4");

        CookieManager cookies = CookieManager.getInstance();
        cookies.setAcceptCookie(true);
        cookies.setAcceptThirdPartyCookies(webView, true);

        webView.clearCache(true);
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);

        webView.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return false;
            }
        });

        webView.addJavascriptInterface(new AfrnDownloadBridge(), "AFRNAndroid");

        webView.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (filePathCallback != null) {
                    filePathCallback.onReceiveValue(null);
                }
                filePathCallback = callback;

                Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("image/*");
                intent.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{
                        "image/jpeg", "image/png", "image/webp"
                });

                Intent chooser = Intent.createChooser(intent, "Chagua picha ya mchezaji");

                try {
                    startActivityForResult(chooser, FILE_CHOOSER_REQUEST);
                } catch (Exception e) {
                    filePathCallback.onReceiveValue(null);
                    filePathCallback = null;
                    return false;
                }
                return true;
            }
        });

        webView.loadUrl(APP_URL + "?app=" + System.currentTimeMillis());
    }


    private class AfrnDownloadBridge {
        @JavascriptInterface
        public void saveBase64File(String filename, String mimeType, String base64Data) {
            webView.post(() -> saveBase64FileOnUi(filename, mimeType, base64Data));
        }

        private void saveBase64FileOnUi(String filename, String mimeType, String base64Data) {
            try {
                Uri current = Uri.parse(webView.getUrl() == null ? "" : webView.getUrl());
                if (!"enyonyiabemba94-eng.github.io".equals(current.getHost())) {
                    showDownloadMessage("Hifadhi imezuiwa kwa ukurasa usioaminika.");
                    return;
                }
                String safeName = filename == null ? "AFRN-ripoti.pdf" : filename.replaceAll("[^A-Za-z0-9._-]", "_");
                if (safeName.isEmpty()) safeName = "AFRN-ripoti.pdf";
                String safeMime = (mimeType == null || mimeType.isEmpty()) ? "application/octet-stream" : mimeType;
                byte[] bytes = Base64.decode(base64Data, Base64.DEFAULT);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    ContentValues values = new ContentValues();
                    values.put(MediaStore.Downloads.DISPLAY_NAME, safeName);
                    values.put(MediaStore.Downloads.MIME_TYPE, safeMime);
                    values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/AFRN");
                    values.put(MediaStore.Downloads.IS_PENDING, 1);
                    Uri fileUri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                    if (fileUri == null) throw new Exception("Imeshindwa kuunda faili");
                    try (OutputStream output = getContentResolver().openOutputStream(fileUri)) {
                        if (output == null) throw new Exception("Imeshindwa kufungua faili");
                        output.write(bytes);
                        output.flush();
                    }
                    ContentValues done = new ContentValues();
                    done.put(MediaStore.Downloads.IS_PENDING, 0);
                    getContentResolver().update(fileUri, done, null, null);
                } else {
                    File folder = getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
                    if (folder == null) throw new Exception("Folda ya kuhifadhi haipatikani");
                    if (!folder.exists() && !folder.mkdirs()) throw new Exception("Imeshindwa kuunda folda");
                    try (FileOutputStream output = new FileOutputStream(new File(folder, safeName))) {
                        output.write(bytes);
                        output.flush();
                    }
                }
                showDownloadMessage("Faili imehifadhiwa: Downloads/AFRN/" + safeName);
            } catch (Exception e) {
                showDownloadMessage("Upakuaji umeshindikana. Jaribu tena au tumia Chrome.");
            }
        }
    }

    private void showDownloadMessage(String message) {
        runOnUiThread(() -> Toast.makeText(MainActivity.this, message, Toast.LENGTH_LONG).show());
    }

    @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != FILE_CHOOSER_REQUEST || filePathCallback == null) return;

        Uri[] results = null;
        if (resultCode == RESULT_OK && data != null) {
            Uri uri = data.getData();
            if (uri != null) results = new Uri[]{uri};
        }

        filePathCallback.onReceiveValue(results);
        filePathCallback = null;
    }

    @Override protected void onDestroy() {
        if (filePathCallback != null) {
            filePathCallback.onReceiveValue(null);
            filePathCallback = null;
        }
        if (webView != null) {
            webView.destroy();
        }
        super.onDestroy();
    }

    @Override public void onBackPressed() {
        if (webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }
}
