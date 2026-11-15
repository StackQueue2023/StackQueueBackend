import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        Map<String, Integer> map = new LinkedHashMap<>();
        while (sc.hasNext()) {
            String w = sc.next().toLowerCase();
            map.put(w, map.getOrDefault(w, 0) + 1);
        }
        String topW = ""; int maxC = 0;
        for (Map.Entry<String, Integer> e : map.entrySet()) {
            if (e.getValue() > maxC) { maxC = e.getValue(); topW = e.getKey(); }
        }
        System.out.println("Unique: " + map.size() + " | Most Frequent: " + topW + " (" + maxC + ")");
    }
}