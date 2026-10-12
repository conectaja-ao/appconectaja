package com.heyclaude.app;

import android.annotation.SuppressLint;
import android.app.PendingIntent;
import android.content.Intent;
import android.os.Build;
import android.service.quicksettings.Tile;
import android.service.quicksettings.TileService;

/** Mosaico "Hey Claude" nas definições rápidas, para ligar e desligar depressa. */
public class QuickTileService extends TileService {

    @Override
    public void onStartListening() {
        refresh();
    }

    @Override
    @SuppressWarnings("deprecation")
    @SuppressLint("StartActivityAndCollapseDeprecated") // só é usado abaixo do Android 14
    public void onClick() {
        if (WakeWordService.isRunning()) {
            WakeWordService.stop(this);
            refresh();
            return;
        }
        // Ligar o microfone exige um ecrã à frente: passa pela StartActivity.
        Intent start = new Intent(this, StartActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        if (Build.VERSION.SDK_INT >= 34) {
            startActivityAndCollapse(PendingIntent.getActivity(this, 0, start,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));
        } else {
            startActivityAndCollapse(start);
        }
    }

    private void refresh() {
        Tile tile = getQsTile();
        if (tile == null) return;
        tile.setState(WakeWordService.isRunning() ? Tile.STATE_ACTIVE : Tile.STATE_INACTIVE);
        tile.updateTile();
    }
}
