package com.thailottery.checker;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.util.Base64;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.text.Text;
import com.google.mlkit.vision.text.TextRecognition;
import com.google.mlkit.vision.text.TextRecognizer;
import com.google.mlkit.vision.text.latin.TextRecognizerOptions;

/** Reads text from a photo on the device with Google ML Kit (offline). */
@CapacitorPlugin(name = "TicketScanner")
public class TicketScannerPlugin extends Plugin {

    private TextRecognizer recognizer;

    @Override
    public void load() {
        recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS);
    }

    @PluginMethod
    public void recognize(PluginCall call) {
        String image = call.getString("image");
        if (image == null || image.isEmpty()) {
            call.reject("Missing image");
            return;
        }
        Bitmap bitmap;
        try {
            int comma = image.indexOf(',');
            byte[] bytes = Base64.decode(comma >= 0 ? image.substring(comma + 1) : image, Base64.DEFAULT);
            bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.length);
        } catch (IllegalArgumentException e) {
            call.reject("Invalid image data");
            return;
        }
        if (bitmap == null) {
            call.reject("Could not decode image");
            return;
        }
        recognizer
            .process(InputImage.fromBitmap(bitmap, 0))
            .addOnSuccessListener(result -> {
                JSArray lines = new JSArray();
                for (Text.TextBlock block : result.getTextBlocks()) {
                    for (Text.Line line : block.getLines()) lines.put(line.getText());
                }
                JSObject ret = new JSObject();
                ret.put("lines", lines);
                call.resolve(ret);
            })
            .addOnFailureListener(e -> call.reject("Text recognition failed: " + e.getMessage()));
    }
}
