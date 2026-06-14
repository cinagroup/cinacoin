package com.cinacoin.appkit.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.cinacoin.appkit.config.ChainRegistry
import com.cinacoin.appkit.config.CinacoinTheme
import com.cinacoin.appkit.config.model.ChainConfig

/**
 * Chain selector dropdown
 */
@Composable
fun CinacoinChainSelector(
    selectedChainId: Int,
    onChainSelected: (Int) -> Unit,
    chains: List<ChainConfig> = ChainRegistry.allEVMChains,
    theme: CinacoinTheme = if (androidx.compose.foundation.isSystemInDarkTheme()) 
        CinacoinTheme.Dark else CinacoinTheme.Light
) {
    var expanded by remember { mutableStateOf(false) }
    val selectedChain = chains.firstOrNull { it.chainId == selectedChainId }
    
    Box {
        Row(
            modifier = Modifier
                .clip(RoundedCornerShape(20.dp))
                .background(theme.surface)
                .border(1.dp, theme.border, RoundedCornerShape(20.dp))
                .clickable { expanded = true }
                .padding(horizontal = 12.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            if (selectedChain != null) {
                AsyncImage(
                    model = selectedChain.iconUrl,
                    contentDescription = selectedChain.name,
                    modifier = Modifier
                        .size(20.dp)
                        .clip(CircleShape)
                )
                
                Spacer(modifier = Modifier.width(8.dp))
                
                Text(
                    text = selectedChain.shortName.uppercase(),
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                    color = theme.text
                )
            }
            
            Icon(
                imageVector = Icons.Default.KeyboardArrowDown,
                contentDescription = null,
                tint = theme.textSecondary,
                modifier = Modifier.size(16.dp)
            )
        }
        
        DropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false }
        ) {
            chains.forEach { chain ->
                DropdownMenuItem(
                    text = {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            AsyncImage(
                                model = chain.iconUrl,
                                contentDescription = chain.name,
                                modifier = Modifier
                                    .size(20.dp)
                                    .clip(CircleShape)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(chain.name)
                        }
                    },
                    onClick = {
                        onChainSelected(chain.chainId)
                        expanded = false
                    },
                    trailingIcon = {
                        if (chain.chainId == selectedChainId) {
                            Text("✓", color = theme.primary)
                        }
                    }
                )
            }
        }
    }
}
