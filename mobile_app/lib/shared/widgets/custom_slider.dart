import 'package:flutter/material.dart';
import '../../app/theme.dart';

/// Custom styled slider with gradient track and animated thumb
class CustomSlider extends StatefulWidget {
  final double value;
  final double min;
  final double max;
  final int? divisions;
  final Color activeColor;
  final Color inactiveColor;
  final ValueChanged<double> onChanged;
  final String? Function(double)? labelBuilder;

  const CustomSlider({
    super.key,
    required this.value,
    required this.min,
    required this.max,
    this.divisions,
    required this.activeColor,
    Color? inactiveColor,
    required this.onChanged,
    this.labelBuilder,
  }) : inactiveColor = inactiveColor ?? const Color(0xFFE5E7EB);

  @override
  State<CustomSlider> createState() => _CustomSliderState();
}

class _CustomSliderState extends State<CustomSlider>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;
  bool _isDragging = false;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 150),
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 1.2).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeOut),
    );
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  void _onDragStart() {
    setState(() => _isDragging = true);
    _animationController.forward();
  }

  void _onDragEnd() {
    setState(() => _isDragging = false);
    _animationController.reverse();
  }

  @override
  Widget build(BuildContext context) {
    // Prevent division by zero when min == max
    final range = widget.max - widget.min;
    final progress = (range > 0 && range.isFinite)
        ? ((widget.value - widget.min) / range).clamp(0.0, 1.0)
        : 0.5;

    return LayoutBuilder(
      builder: (context, constraints) {
        // Validate constraints
        if (!constraints.hasBoundedWidth ||
            constraints.maxWidth <= 0 ||
            constraints.maxWidth.isNaN ||
            constraints.maxWidth.isInfinite) {
          return const SizedBox(height: 48);
        }

        final trackWidth = constraints.maxWidth;
        final availableTrackWidth = (trackWidth - 24).clamp(0.0, double.infinity);
        final thumbPosition = (progress * availableTrackWidth).clamp(0.0, availableTrackWidth);

        return GestureDetector(
          onHorizontalDragStart: (_) => _onDragStart(),
          onHorizontalDragEnd: (_) => _onDragEnd(),
          onHorizontalDragCancel: _onDragEnd,
          onHorizontalDragUpdate: (details) {
            final newProgress = (details.localPosition.dx / trackWidth)
                .clamp(0.0, 1.0);
            var newValue = widget.min + newProgress * (widget.max - widget.min);

            // Snap to divisions if provided
            if (widget.divisions != null) {
              final step = (widget.max - widget.min) / widget.divisions!;
              newValue = (newValue / step).round() * step;
            }

            widget.onChanged(newValue.clamp(widget.min, widget.max));
          },
          onTapDown: (details) {
            final newProgress = (details.localPosition.dx / trackWidth)
                .clamp(0.0, 1.0);
            var newValue = widget.min + newProgress * (widget.max - widget.min);

            if (widget.divisions != null) {
              final step = (widget.max - widget.min) / widget.divisions!;
              newValue = (newValue / step).round() * step;
            }

            widget.onChanged(newValue.clamp(widget.min, widget.max));
          },
          child: SizedBox(
            height: 48,
            child: Stack(
              alignment: Alignment.center,
              clipBehavior: Clip.none,
              children: [
                // Track background
                Container(
                  height: 8,
                  decoration: BoxDecoration(
                    color: widget.inactiveColor,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),

                // Active track with gradient
                Positioned(
                  left: 0,
                  child: Container(
                    width: (thumbPosition + 12).clamp(0.0, trackWidth).toDouble(),
                    height: 8,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          widget.activeColor.withValues(alpha: 0.7),
                          widget.activeColor,
                        ],
                      ),
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                ),

                // Thumb
                Positioned(
                  left: thumbPosition.toDouble(),
                  child: AnimatedBuilder(
                    animation: _scaleAnimation,
                    builder: (context, child) {
                      return Transform.scale(
                        scale: _scaleAnimation.value,
                        child: child,
                      );
                    },
                    child: Container(
                      width: 24,
                      height: 24,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: widget.activeColor,
                          width: 3,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: widget.activeColor.withValues(alpha: 0.3),
                            blurRadius: _isDragging ? 12 : 6,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),

                // Label tooltip when dragging
                if (_isDragging && widget.labelBuilder != null)
                  Positioned(
                    left: (thumbPosition - 20).clamp(0.0, (trackWidth - 60).clamp(0.0, double.infinity)).toDouble(),
                    top: -36,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: widget.activeColor,
                        borderRadius: BorderRadius.circular(8),
                        boxShadow: [
                          BoxShadow(
                            color: widget.activeColor.withValues(alpha: 0.3),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Text(
                        widget.labelBuilder!(widget.value) ?? '',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        );
      },
    );
  }
}

/// Custom range selector with chips
class CustomRangeSelector<T> extends StatelessWidget {
  final T value;
  final List<T> options;
  final String Function(T) labelBuilder;
  final ValueChanged<T> onChanged;
  final Color activeColor;

  const CustomRangeSelector({
    super.key,
    required this.value,
    required this.options,
    required this.labelBuilder,
    required this.onChanged,
    this.activeColor = const Color(0xFF6366F1),
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: options.map((option) {
          final isSelected = value == option;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: GestureDetector(
              onTap: () => onChanged(option),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(
                  horizontal: 18,
                  vertical: 12,
                ),
                decoration: BoxDecoration(
                  color: isSelected ? activeColor : Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isSelected ? activeColor : AppTheme.neutral200,
                    width: isSelected ? 2 : 1,
                  ),
                  boxShadow: isSelected
                      ? [
                          BoxShadow(
                            color: activeColor.withValues(alpha: 0.25),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ]
                      : null,
                ),
                child: Text(
                  labelBuilder(option),
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: isSelected ? Colors.white : AppTheme.neutral700,
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}
