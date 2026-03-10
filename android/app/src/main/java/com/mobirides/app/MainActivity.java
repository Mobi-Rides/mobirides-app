package com.mobirides.app;

import android.os.Bundle;
import android.view.View;
import android.webkit.WebView;

import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onResume() {
        super.onResume();

        // Set up toolbar navigation after view is created
        View view = findViewById(android.R.id.content);
        if (view != null) {
            Toolbar toolbar = view.findViewById(com.mobirides.app.R.id.toolbar);
            if (toolbar != null) {
                toolbar.setNavigationOnClickListener(v -> {
                    // Trigger back navigation in webview
                    navigateBack();
                });
            }
        }
    }

    private void navigateBack() {
        runOnUiThread(() -> {
            WebView webView = getBridge().getWebView();
            if (webView != null && webView.canGoBack()) {
                webView.goBack();
            } else {
                // No more history, finish the activity
                finish();
            }
        });
    }

    @Override
    public void onBackPressed() {
        // Try to go back in webview first
        WebView webView = getBridge().getWebView();
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
